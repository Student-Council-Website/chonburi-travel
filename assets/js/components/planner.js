import { PLACES } from '../data/places.js';
import { DISTRICTS } from '../data/districts.js';

export function generateTripItinerary(days = 2, selectedInterests = ['sea', 'cafe', 'restaurant', 'photo'], lang = 'th') {
  const isEn = lang === 'en';
  const safeDays = Number.isInteger(days) ? Math.min(Math.max(days, 1), 4) : 2;
  const interests = Array.isArray(selectedInterests) ? selectedInterests : [];
  let availablePlaces = PLACES.filter(p => interests.includes(p.category) || p.isTrending);

  if (availablePlaces.length < safeDays * 4) {
    availablePlaces = [...PLACES];
  }

  const itineraryDays = [];
  const usedPlaceIds = new Set();

  const timeSlots = isEn ? [
    { time: "08:30 AM", label: "Breakfast & Morning Start", categoryPref: ["cafe", "nature", "sea"] },
    { time: "10:30 AM", label: "Daily Highlight & Landmark", categoryPref: ["sea", "history", "photo", "nature"] },
    { time: "12:30 PM", label: "Local Seafood & Thai Lunch", categoryPref: ["restaurant", "sea"] },
    { time: "02:30 PM", label: "Specialty Cafe & Photo Shoot", categoryPref: ["cafe", "photo"] },
    { time: "05:00 PM", label: "Sunset Viewpoint & Promenade", categoryPref: ["photo", "sea", "nature"] },
    { time: "07:00 PM", label: "Chill Dinner & Night Atmosphere", categoryPref: ["restaurant", "shopping"] }
  ] : [
    { time: "08:30 น.", label: "มื้อเช้า & กิจกรรมต้อนรับวันใหม่", categoryPref: ["cafe", "nature", "sea"] },
    { time: "10:30 น.", label: "แลนด์มาร์คไฮไลท์ประจำวัน", categoryPref: ["sea", "history", "photo", "nature"] },
    { time: "12:30 น.", label: "รับประทานอาหารกลางวันพื้นบ้านเด็ด", categoryPref: ["restaurant", "sea"] },
    { time: "14:30 น.", label: "เช็คอินคาเฟ่เก๋ๆ & ถ่ายรูปสวย", categoryPref: ["cafe", "photo"] },
    { time: "17:00 น.", label: "ชมพระอาทิตย์ตกดิน & จุดชมวิว", categoryPref: ["photo", "sea", "nature"] },
    { time: "19:00 น.", label: "มื้อค่ำสุดชิลล์ริมทะเล / ตลาดกลางคืน", categoryPref: ["restaurant", "shopping"] }
  ];

  const districtFocusList = [
    ["chonburi-muang", "banglamung"],
    ["sriracha", "kohsichang"],
    ["sattahip", "banglamung"],
    ["phanatnikhom", "banbueng", "kohchan"]
  ];

  for (let d = 1; d <= safeDays; d++) {
    const dayDistricts = districtFocusList[(d - 1) % districtFocusList.length];
    const dayItems = [];

    timeSlots.forEach(slot => {
      let candidate = availablePlaces.find(p => 
        !usedPlaceIds.has(p.id) && 
        dayDistricts.includes(p.districtId) && 
        slot.categoryPref.includes(p.category)
      );

      if (!candidate) {
        candidate = availablePlaces.find(p => !usedPlaceIds.has(p.id) && slot.categoryPref.includes(p.category));
      }

      if (!candidate) {
        candidate = availablePlaces.find(p => !usedPlaceIds.has(p.id));
      }

      if (candidate) {
        usedPlaceIds.add(candidate.id);
        const districtObj = DISTRICTS.find(dis => dis.id === candidate.districtId);
        const districtName = districtObj ? (isEn ? districtObj.nameEn : districtObj.nameTh) : (isEn ? "Chonburi" : "ชลบุรี");

        dayItems.push({
          time: slot.time,
          titleLabel: slot.label,
          place: candidate,
          districtName: districtName
        });
      }
    });

    const dayDistrictNames = dayDistricts.map(did => {
      const dt = DISTRICTS.find(item => item.id === did);
      return dt ? (isEn ? dt.nameEn : dt.nameTh) : null;
    }).filter(Boolean).join(isEn ? " & " : " & ");

    itineraryDays.push({
      dayNumber: d,
      title: isEn ? `Day ${d}: Discover ${dayDistrictNames}` : `วันที่ ${d}: ค้นพบเสน่ห์${dayDistrictNames}`,
      schedule: dayItems
    });
  }

  return itineraryDays;
}
