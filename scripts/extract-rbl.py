"""One-off extraction of the Rwanda Basketball League 2026 from AfroBasket.

Run from the repo root. Fetches each team's roster page once and writes a static
JSON file into the repo, which the seeder then reads. The seeder deliberately does
NOT fetch: a seed that depends on a third-party site is a seed that fails on a bad
day, and the extracted data belongs in review like any other fixture data.

Only pages that are plainly readable are used. AfroBasket protects its STATISTICS
tables with a remapped font (class="encryptfont"), and none of that is touched.
"""
import io, json, re, sys, time, urllib.request

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
# The BARE /Roster is the live one. /Roster/2026 renders an empty shell for every
# club, and the year in the path is not the season the page shows — the bare URL
# serves each club's most recent published squad, which is 2026 for some and 2025
# for others. So the season is read off the page's own header and recorded per
# club, and nothing is dated by assumption.
BASE = 'https://basketball.afrobasket.com/team/{slug}/{tid}/Roster'


def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode('utf-8', 'ignore')
        except Exception as e:
            if i == tries - 1:
                print('  FAILED', url, e)
                return None
            time.sleep(2)


def unescape(x):
    return (x.replace('&amp;', '&').replace('&#39;', "'").replace('&quot;', '"')
             .replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').strip())


NAT = {
    'RWA': 'Rwandan', 'USA': 'USA', 'SEN': 'Senegal', 'FRA': 'France', 'CAN': 'Canada',
    'NGR': 'Nigeria', 'KEN': 'Kenya', 'UGA': 'Uganda', 'TAN': 'Tanzania', 'BDI': 'Burundi',
    'COD': 'DR Congo', 'CMR': 'Cameroon', 'GHA': 'Ghana', 'MLI': 'Mali', 'CIV': "Cote d'Ivoire",
    'SSD': 'South Sudan', 'BUR': 'Burkina Faso', 'ANG': 'Angola', 'GBR': 'Great Britain',
    'GER': 'Germany', 'BEL': 'Belgium', 'NED': 'Netherlands', 'ESP': 'Spain', 'ITA': 'Italy',
    'CHA': 'Chad', 'CAF': 'Central African Republic', 'GRE': 'Greece', 'JAM': 'Jamaica',
    'IVO': "Cote d'Ivoire", 'AUS': 'Australia', 'HOL': 'Netherlands', 'ZAM': 'Zambia',
}

POSITION = {'PG': 'Point Guard', 'SG': 'Shooting Guard', 'G': 'Guard',
            'SF': 'Small Forward', 'PF': 'Power Forward', 'F': 'Forward', 'C': 'Center'}


def parse_team(html, slug, tid):
    title = re.findall(r'<title>(.*?)</title>', html, re.S)
    name = unescape(re.sub(r'\s+', ' ', title[0])) if title else slug.replace('-', ' ')
    name = re.sub(r'\s*Basketball Roster.*$', '', name).strip()

    logo = re.findall(r'src="(https://www\.eurobasket\.com/logos/[^"]+)"', html)

    # "Espoir BBC Kigali 2025" — the page says which season it is showing.
    head = re.findall(r'class="tabletop"[^>]*>(.*?)</td>', html, re.S)
    season = None
    for h in head:
        m = re.search(r'(20\d\d)(?:-\d+)?\s*$', unescape(re.sub(r'<[^>]+>', ' ', h)))
        if m:
            season = int(m.group(1))
            break

    # Featured cards carry the headshots, keyed by the player id in the href.
    photos = {}
    for pid, src in re.findall(
        r'ArRosterfeat-card[^>]*href="[^"]*/player/[^/]+/(\d+)"[^>]*>\s*<div class="ArRosterfeat-img">\s*<img src="([^"]+)"',
        html,
    ):
        photos[pid] = src

    players = []
    # Every roster row carries its own data-* attributes; the surrounding markup
    # varies but these do not.
    for block in re.findall(r'<div class="ArRosterplayer[^"]*"([^>]*)>(.*?)(?=<div class="ArRosterplayer|<div class="ArRosterfooter|$)',
                            html, re.S):
        attrs, body = block
        get = lambda k: (re.findall(rf'{k}="([^"]*)"', attrs) or [''])[0]
        pid = get('data-playerid')
        nat = get('data-rnat')
        pos = get('data-rpos')

        # The club they came from, if the row names one.
        former = re.findall(r'class="ArRostercollege">.*?<a[^>]*>(.*?)</a>', body, re.S)
        former_country = re.findall(r'class="ArRostercollege">.*?alt="([^"]*)"', body, re.S)

        def num(v):
            try:
                return int(v)
            except Exception:
                return None

        players.append({
            'sourceId': pid,
            'name': unescape(get('data-rname')),
            'number': num(get('data-rnum')),
            'heightCm': num(get('data-rheight')),
            'position': POSITION.get(pos, pos or None),
            'positionCode': pos or None,
            # The source writes a dual national as "COD|RWA".
            'nationality': ' / '.join(NAT.get(n, n) for n in nat.split('|') if n) or None,
            'fromYear': num(get('data-rfromyear')),
            'toYear': num(get('data-rtoyear')),
            'previousClub': unescape(former[0]) if former else None,
            'previousCountry': unescape(former_country[0]) if former_country else None,
            'photo': photos.get(pid),
        })

    # A row with no name is an empty slot in the markup, not a player — and the
    # UNFILTERED list is what made a club with nothing to show claim a 2026 squad.
    kept = [p for p in players if p['name']]

    return {
        # A club with a current squad is on the current season; the year label only
        # appears on the stale, older-markup pages.
        'season': 2026 if kept else season,
        'sourceId': tid,
        'slug': slug,
        'name': name,
        'logo': logo[0] if logo else None,
        'players': kept,
    }


def main():
    teams = json.load(io.open('rbl-teams.json', encoding='utf-8'))
    out = []
    for tid, slug in sorted(teams.items(), key=lambda x: x[1]):
        url = BASE.format(slug=slug, tid=tid)
        html = fetch(url)
        if not html:
            continue
        t = parse_team(html, slug, tid)
        print(f'  {t["name"][:40]:42} {str(t["season"] or "?"):>5}  {len(t["players"]):>3} players  logo={"yes" if t["logo"] else "NO "}')
        out.append(t)
        time.sleep(1)  # civil: one request a second, not a flood

    out.sort(key=lambda t: t['name'])
    path = 'apps/backend/prisma/data/rbl-2026.json'
    io.open(path, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
    print(f'\n{len(out)} teams, {sum(len(t["players"]) for t in out)} players -> {path}')


main()
