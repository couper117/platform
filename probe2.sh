names="Lenard_Teafale Diagne_Mouhamadou Nshobouzoua_Jean Uwitonze_Justin Twa_Prince Mpoyo_Axel Icyogere_Alvin Randall_Craig"
for n in $names; do
  found=""
  for i in 1 2 3 4; do
    for ext in png jpg; do
      url="https://www.eurobasket.com/photos/${n}_${i}.${ext}"
      r=$(curl -s -o /dev/null -w "%{http_code}:%{size_download}" -L --max-time 12 "$url")
      if [ "${r%%:*}" = "200" ]; then echo "OK   ${n}_${i}.${ext}  size=${r##*:}"; found=1; fi
    done
  done
  [ -z "$found" ] && echo "none $n"
done
