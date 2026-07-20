import React, { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dhikr {
  id: string;
  text: string;
  count: number;
  remaining: number;
  source?: string;
}

interface HisnCategory {
  id: string;
  title: string;
  emoji: string;
  duas: {
    text: string;
    count: number;
    source?: string;
  }[];
}

// ─── Authentic Data (Expanded & Verified) ──────────────────────────────────────
const MORNING_ATHKAR: Omit<Dhikr, "remaining">[] = [
  { id: "m1", count: 1, text: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\n(اللهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ...) [آية الكرسي - البقرة: 255]", source: "من قالها حين يصبح أُجير من الجن حتى يمسي" },
  { id: "m2", count: 3, text: "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ\n(قُلْ هُوَ اللَّهُ أَحَدٌ...)\n(قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...)\n(قُلْ أَعُوذُ بِرَبِّ النَّاسِ...)", source: "من قالها ثلاثاً حين يصبح وحين يمسي كفته من كل شيء" },
  { id: "m3", count: 1, text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ للهِ، وَالْحَمْدُ للهِ، لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ", source: "رواه مسلم" },
  { id: "m4", count: 1, text: "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ", source: "سيد الاستغفار — من قالها موقناً بها فمات من يومه دخل الجنة" },
  { id: "m5", count: 4, text: "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلاَئِكَتِكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللهُ لاَ إِلَهَ إِلاَّ أَنْتَ وَحْدَكَ لاَ شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ", source: "من قالها أربعاً أعتقه الله من النار" },
  { id: "m6", count: 1, text: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ", source: "من قالها حين يصبح فقد أدى شكر يومه" },
  { id: "m7", count: 3, text: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ القَبْرِ، لاَ إِلَهَ إِلاَّ أَنْتَ", source: "دعاء العافية والتحصين" },
  { id: "m8", count: 7, text: "حَسْبِيَ اللهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", source: "من قالها سبعاً كفاه الله ما أهمه من أمر الدنيا والآخرة" },
  { id: "m9", count: 1, text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ: فِي دِينِي وَدُنْيَايَ وَأَهْلِي، وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالُ مِنْ تَحْتِي", source: "كان النبي ﷺ لا يدع هؤلاء الكلمات حين يصبح وحين يمسي" },
  { id: "m10", count: 3, text: "بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", source: "من قالها ثلاثاً لم يضره شيء" },
  { id: "m11", count: 3, text: "رَضِيتُ بِاللهِ رَبّاً، وَبِالإِسْلاَمِ دِيناً، وَبِمُحَمَّدٍ ﷺ نَبِيّاً", source: "من قالها ثلاثاً كان حقاً على الله أن يرضيه يوم القيامة" },
  { id: "m12", count: 1, text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لي شَأْنِي كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", source: "دعاء الاستغاثة العظيم" },
  { id: "m13", count: 3, text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمَدَادَ كَلِمَاتِهِ", source: "من أذكار الصباح العظيمة" },
  { id: "m14", count: 100, text: "أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ", source: "مئة مرة في اليوم" },
  { id: "m15", count: 100, text: "لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", source: "مئة مرة — كانت له عدل عشر رقاب وكتبت له مئة حسنة" }
];

const EVENING_ATHKAR: Omit<Dhikr, "remaining">[] = [
  { id: "e1", count: 1, text: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\n(اللهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ...) [آية الكرسي - البقرة: 255]", source: "من قالها حين يمسي أُجير من الجن حتى يصبح" },
  { id: "e2", count: 3, text: "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ\n(قُلْ هُوَ اللَّهُ أَحَدٌ...)\n(قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...)\n(قُلْ أَعُوذُ بِرَبِّ النَّاسِ...)", source: "من قالها ثلاثاً حين يصبح وحين يمسي كفته من كل شيء" },
  { id: "e3", count: 1, text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ للهِ، وَالْحَمْدُ للهِ، لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ", source: "رواه مسلم" },
  { id: "e4", count: 1, text: "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ", source: "سيد الاستغفار — من قالها موقناً بها فمات من ليلته دخل الجنة" },
  { id: "e5", count: 4, text: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلاَئِكَتِكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللهُ لاَ إِلَهَ إِلاَّ أَنْتَ وَحْدَكَ لاَ شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ", source: "من قالها أربعاً أعتقه الله من النار" },
  { id: "e6", count: 1, text: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ", source: "من قالها حين يمسي فقد أدى شكر ليلته" },
  { id: "e7", count: 3, text: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ القَبْرِ، لاَ إِلَهَ إِلاَّ أَنْتَ", source: "دعاء العافية والتحصين" },
  { id: "e8", count: 7, text: "حَسْبِيَ اللهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", source: "من قالها سبعاً كفاه الله ما أهمه من أمر الدنيا والآخرة" },
  { id: "e9", count: 1, text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ: فِي دِينِي وَدُنْيَايَ وَأَهْلِي، وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي، وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالُ مِنْ تَحْتِي", source: "كان النبي ﷺ لا يدع هؤلاء الكلمات حين يصبح وحين يمسي" },
  { id: "e10", count: 3, text: "بِسْمِ اللهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", source: "من قالها ثلاثاً لم يضره شيء" },
  { id: "e11", count: 3, text: "رَضِيتُ بِاللهِ رَبّاً، وَبِالإِسْلاَمِ دِيناً، وَبِمُحَمَّدٍ ﷺ نَبِيّاً", source: "من قالها ثلاثاً كان حقاً على الله أن يرضيه يوم القيامة" },
  { id: "e12", count: 3, text: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", source: "من قالها ثلاثاً لم تضره حمة تلك الليلة" },
  { id: "e13", count: 100, text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ", source: "مئة مرة — حطت خطاياه وإن كانت مثل زبد البحر" }
];

const HISN_ALMUSLIM: HisnCategory[] = [
  {
    id: "h1",
    title: "أذكار الاستيقاظ من النوم",
    emoji: "🌅",
    duas: [
      { text: "الْحَمْدُ للهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", count: 1 },
      { text: "لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، سُبْحَانَ اللهِ، وَالْحَمْدُ للهِ، وَلاَ إِلَهَ إِلاَّ اللهُ، وَاللهُ أَكْبَرُ، وَلاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللهِ الْعَلِيِّ الْعَظِيمِ، رَبِّ اغْفِرْ لِي", count: 1, source: "من تعارّ من الليل فقالها ثم دعا استجيب له" }
    ]
  },
  {
    id: "h2",
    title: "أذكار النوم",
    emoji: "🌙",
    duas: [
      { text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا، بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ", count: 1 },
      { text: "اللَّهُمَّ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا. اللَّهُمَّ إِنِّي أَسْأَلُكَ العَافِيَةَ", count: 1 },
      { text: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", count: 3, source: "يقوله إذا وضع يده اليمنى تحت خده عند النوم" }
    ]
  },
  {
    id: "h3",
    title: "دعاء السفر",
    emoji: "🚗",
    duas: [
      { text: "اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، اللهُ أَكْبَرُ، {سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ * وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ} اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الأَهْلِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ، وَكَآبَةِ الْمَنْظَرِ، وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالأَهْلِ", count: 1 }
    ]
  },
  {
    id: "h4",
    title: "دعاء دخول وخروج المسجد",
    emoji: "🕌",
    duas: [
      { text: "أَعُوذُ بِاللهِ الْعَظِيمِ، وَبِوَجْهِهِ الْكَرِيمِ، وَسُلْطَانِهِ الْقَدِيمِ، مِنَ الشَّيْطَانِ الرَّجِيمِ. بِسْمِ اللهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللهِ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", count: 1, source: "عند دخول المسجد" },
      { text: "بِسْمِ اللهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللهِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ، اللَّهُمَّ اعْصِمْنِي مِنَ الشَّيْطَانِ الرَّجِيمِ", count: 1, source: "عند الخروج من المسجد" }
    ]
  },
  {
    id: "h5",
    title: "دعاء الكرب والهم",
    emoji: "🌿",
    duas: [
      { text: "لاَ إِلَهَ إِلاَّ اللهُ الْعَظِيمُ الْحَلِيمُ، لاَ إِلَهَ إِلاَّ اللهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لاَ إِلَهَ إِلاَّ اللهُ رَبُّ السَّمَوَاتِ وَرَبُّ الأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ", count: 1, source: "متفق عليه" },
      { text: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ لاَ إِلَهَ إِلاَّ أَنْتَ", count: 1 },
      { text: "لاَ إِلَهَ إِلاَّ أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", count: 1, source: "دعاء ذي النون — ما دعا به رجل في كرب إلا استجاب الله له" }
    ]
  }
];

type Tab = "morning" | "evening" | "hisn";
const STORAGE_KEY = "tawazon_athkar_only_v2";

const tabColors: Record<Tab, string> = {
  morning: "var(--gold)",
  evening: "var(--brand)",
  hisn: "#1e3a8a",
};

export const Athkar: React.FC = () => {
  const [tab, setTab] = useState<Tab>("morning");
  const [selectedHisnCat, setSelectedHisnCat] = useState<HisnCategory | null>(null);
  const [hisnDuasProgress, setHisnDuasProgress] = useState<Record<string, number>>({});
  const todayStr = new Date().toDateString();

  const initDhikr = (items: Omit<Dhikr, "remaining">[]): Dhikr[] =>
    items.map(d => ({ ...d, remaining: d.count }));

  const [morning, setMorning] = useState<Dhikr[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY + "_morning");
      if (s) { const p = JSON.parse(s); if (p.date === todayStr) return p.data; }
    } catch { /* ignore */ }
    return initDhikr(MORNING_ATHKAR);
  });

  const [evening, setEvening] = useState<Dhikr[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY + "_evening");
      if (s) { const p = JSON.parse(s); if (p.date === todayStr) return p.data; }
    } catch { /* ignore */ }
    return initDhikr(EVENING_ATHKAR);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + "_morning", JSON.stringify({ date: todayStr, data: morning }));
  }, [morning, todayStr]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + "_evening", JSON.stringify({ date: todayStr, data: evening }));
  }, [evening, todayStr]);

  const tap = (list: Dhikr[], setList: React.Dispatch<React.SetStateAction<Dhikr[]>>, id: string) => {
    setList(list.map(d => d.id === id && d.remaining > 0 ? { ...d, remaining: d.remaining - 1 } : d));
  };

  const reset = (base: Omit<Dhikr, "remaining">[], setList: React.Dispatch<React.SetStateAction<Dhikr[]>>) => {
    setList(initDhikr(base));
  };

  const handleHisnDuaTap = (catId: string, duaIdx: number, maxCount: number) => {
    const key = `${catId}_${duaIdx}`;
    const current = hisnDuasProgress[key] || 0;
    if (current < maxCount) {
      setHisnDuasProgress(prev => ({
        ...prev,
        [key]: current + 1
      }));
    }
  };

  const handleHisnReset = (cat: HisnCategory) => {
    const next = { ...hisnDuasProgress };
    cat.duas.forEach((_, idx) => {
      delete next[`${cat.id}_${idx}`];
    });
    setHisnDuasProgress(next);
  };

  const currentList = tab === "morning" ? morning : evening;
  const currentBase = tab === "morning" ? MORNING_ATHKAR : EVENING_ATHKAR;
  const currentSet  = tab === "morning" ? setMorning : setEvening;

  const doneCount = currentList.filter(d => d.remaining === 0).length;
  const totalCount = currentList.length;
  const allDone = doneCount === totalCount;
  const color = tabColors[tab];

  const tabsList: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "morning",
      label: "أذكار الصباح",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )
    },
    {
      id: "evening",
      label: "أذكار المساء",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )
    },
    {
      id: "hisn",
      label: "حصن المسلم",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    }
  ];

  return (
    <div style={container}>
      {/* Tabs */}
      <div style={tabRow}>
        {tabsList.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelectedHisnCat(null); }}
            style={{
              ...tabBtn,
              backgroundColor: tab === t.id ? tabColors[t.id] : "transparent",
              color: tab === t.id ? "white" : "var(--text-muted)",
              borderColor: tab === t.id ? tabColors[t.id] : "var(--bg-accent)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab !== "hisn" && (
        <>
          {/* Progress bar */}
          <div style={{ ...progressOuter, borderColor: color + "30" }}>
            <div style={progressInner}>
              <div style={progressBar}>
                <div style={{ ...progressFill, width: `${(doneCount / totalCount) * 100}%`, backgroundColor: color }} />
              </div>
              <p style={progressText}>
                {allDone ? "✨ أحسنت! أتممت جميع أذكار هذا القسم" : `${doneCount} من ${totalCount} مكتمل`}
              </p>
            </div>
            <button onClick={() => reset(currentBase, currentSet)} style={resetBtn} title="إعادة تعيين">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>

          {/* Dhikr cards */}
          <div style={cardList}>
            {currentList.map(d => {
              const done = d.remaining === 0;
              const progress = ((d.count - d.remaining) / d.count) * 100;

              return (
                <div
                  key={d.id}
                  style={{
                    ...dhikrCard,
                    opacity: done ? 0.75 : 1,
                    borderColor: done ? color + "60" : "var(--bg-accent)",
                    backgroundColor: done ? color + "08" : "var(--bg-card)",
                  }}
                >
                  <p style={dhikrText}>{d.text}</p>
                  {d.source && <p style={dhikrSource}>{d.source}</p>}

                  <div style={counterRow}>
                    <div style={miniProgressOuter}>
                      <div style={{ ...miniProgressFill, width: `${progress}%`, backgroundColor: color }} />
                    </div>
                    <div style={counterRight}>
                      <span style={{ ...countBadge, backgroundColor: done ? color : "var(--bg-accent)", color: done ? "white" : "var(--text-muted)" }}>
                        {done ? "✓" : d.remaining}
                      </span>
                      <button
                        onClick={() => tap(currentList, currentSet, d.id)}
                        disabled={done}
                        style={{ ...tapBtn, backgroundColor: done ? "var(--bg-accent)" : color, cursor: done ? "not-allowed" : "pointer" }}
                      >
                        {done ? "تم" : "اضغط"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "hisn" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!selectedHisnCat ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {HISN_ALMUSLIM.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedHisnCat(cat)}
                  style={{
                    padding: "20px",
                    borderRadius: "16px",
                    border: "1px solid var(--bg-accent)",
                    backgroundColor: "var(--bg-card)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    boxShadow: "var(--shadow-sm)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--brand)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--bg-accent)"}
                >
                  <span style={{ fontSize: "28px" }}>{cat.emoji}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>
                      {cat.title}
                    </h4>
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                      {cat.duas.length} أدعية مأثورة
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Back button & title bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--bg-accent)", paddingBottom: "12px" }}>
                <button
                  onClick={() => setSelectedHisnCat(null)}
                  style={{
                    background: "none",
                    border: "1px solid var(--bg-accent)",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>→</span>
                  <span>الرجوع للمجموعات</span>
                </button>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>
                    {selectedHisnCat.title}
                  </h3>
                  <button
                    onClick={() => handleHisnReset(selectedHisnCat)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                    title="إعادة التعيين"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Supplication lists */}
              <div style={cardList}>
                {selectedHisnCat.duas.map((dua, idx) => {
                  const key = `${selectedHisnCat.id}_${idx}`;
                  const currentCount = hisnDuasProgress[key] || 0;
                  const done = currentCount >= dua.count;
                  const progress = (currentCount / dua.count) * 100;

                  return (
                    <div
                      key={idx}
                      style={{
                        ...dhikrCard,
                        opacity: done ? 0.75 : 1,
                        borderColor: done ? "var(--brand-mid)" : "var(--bg-accent)",
                        backgroundColor: done ? "rgba(17,91,61,0.04)" : "var(--bg-card)",
                      }}
                    >
                      <p style={dhikrText}>{dua.text}</p>
                      {dua.source && <p style={dhikrSource}>{dua.source}</p>}

                      <div style={counterRow}>
                        <div style={miniProgressOuter}>
                          <div style={{ ...miniProgressFill, width: `${progress}%`, backgroundColor: "var(--brand)" }} />
                        </div>
                        <div style={counterRight}>
                          <span style={{ ...countBadge, backgroundColor: done ? "var(--brand)" : "var(--bg-accent)", color: done ? "white" : "var(--text-muted)" }}>
                            {done ? "✓" : dua.count - currentCount}
                          </span>
                          <button
                            onClick={() => handleHisnDuaTap(selectedHisnCat.id, idx, dua.count)}
                            disabled={done}
                            style={{
                              ...tapBtn,
                              backgroundColor: done ? "var(--bg-accent)" : "var(--brand)",
                              cursor: done ? "not-allowed" : "pointer"
                            }}
                          >
                            {done ? "تم" : "اضغط"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const container: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "14px" };
const tabRow: React.CSSProperties    = { display: "flex", gap: "8px", flexWrap: "wrap" };

const tabBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  padding: "8px 16px", borderRadius: "20px",
  border: "1px solid", cursor: "pointer",
  fontFamily: "inherit", fontSize: "13px", fontWeight: "600",
  transition: "all 0.2s ease", flex: "1 1 100px", justifyContent: "center",
};

const progressOuter: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "12px",
  backgroundColor: "var(--bg-card)", border: "1px solid",
  borderRadius: "12px", padding: "12px 16px",
};
const progressInner: React.CSSProperties = { flex: 1 };
const progressBar: React.CSSProperties   = {
  height: "6px", backgroundColor: "var(--bg-accent)",
  borderRadius: "3px", overflow: "hidden", marginBottom: "6px",
};
const progressFill: React.CSSProperties  = { height: "100%", borderRadius: "3px", transition: "width 0.3s ease" };
const progressText: React.CSSProperties  = { margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" };

const resetBtn: React.CSSProperties = {
  background: "none", border: "1px solid var(--bg-accent)",
  borderRadius: "8px", padding: "6px 8px", cursor: "pointer",
  color: "var(--text-muted)", display: "flex", alignItems: "center",
};

const cardList: React.CSSProperties  = { display: "flex", flexDirection: "column", gap: "10px" };
const dhikrCard: React.CSSProperties = { padding: "18px", borderRadius: "14px", border: "1px solid", transition: "all 0.2s ease", boxShadow: "var(--shadow-sm)" };

const dhikrText: React.CSSProperties = {
  margin: "0 0 6px", fontSize: "16px", fontWeight: "700",
  lineHeight: "1.9", color: "var(--text-main)", textAlign: "center", whiteSpace: "pre-line",
};
const dhikrSource: React.CSSProperties = {
  margin: "0 0 12px", fontSize: "11px", color: "var(--text-muted)",
  textAlign: "center", fontStyle: "italic",
};

const counterRow: React.CSSProperties   = { display: "flex", alignItems: "center", gap: "10px" };
const miniProgressOuter: React.CSSProperties = {
  flex: 1, height: "4px", backgroundColor: "var(--bg-accent)", borderRadius: "2px", overflow: "hidden",
};
const miniProgressFill: React.CSSProperties  = { height: "100%", borderRadius: "2px", transition: "width 0.2s ease" };
const counterRight: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 };
const countBadge: React.CSSProperties   = {
  minWidth: "32px", height: "32px", borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "13px", fontWeight: "800", transition: "all 0.2s ease",
};
const tapBtn: React.CSSProperties = {
  padding: "6px 16px", color: "white", border: "none",
  borderRadius: "8px", fontFamily: "inherit", fontSize: "13px",
  fontWeight: "700", transition: "all 0.2s ease",
};
