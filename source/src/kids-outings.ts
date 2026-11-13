import PLACES from './places.json';

export const OUTING_CATEGORIES = [
  { id: 'indoor', zh: '室内游乐与街机', en: 'Indoor Play & Arcades' },
  { id: 'swim', zh: '游泳', en: 'Swimming' },
  { id: 'sport', zh: '运动场馆', en: 'Sports Centres' },
  { id: 'climb', zh: '攀岩·障碍·高尔夫', en: 'Climbing, Ninja & Golf' },
  { id: 'learn', zh: '博物馆与学习', en: 'Museums & Learning' },
  { id: 'outdoors', zh: '动物与户外', en: 'Animals & Outdoors' },
  { id: 'skate', zh: '滑板·泵道·轮滑', en: 'Skate, Pump & Roller' },
] as const;

type Cat = typeof OUTING_CATEGORIES[number]['id'];

type Spec = {
  id: string;
  category: Cat;
  placeId?: string;
  name: string;
  zh: string;
  area?: string;
  areaEn?: string;
  address?: string;
  hours?: string;
  hoursEn?: string;
  price?: string;
  priceEn?: string;
  ages?: string;
  agesEn?: string;
  description?: string;
  descriptionEn?: string;
  url?: string;
  phone?: string;
};

// Facts below are taken from the 2026-11-14 research notes. Fields those notes mark unknown stay as 请以官网为准.
const SPECS: Spec[] = [
  { id: 'jago-town', category: 'indoor', name: 'Jago Town', zh: 'Jago Town 室内游乐', area: 'Te Rapa / The Base', areaEn: 'Te Rapa / The Base', address: 'Shop M03, Te Awa Mall, The Base, Hamilton', phone: '07 846 6688', hours: '每天 9:30–17:30', hoursEn: 'Daily 9:30am–5:30pm', price: '未满 2 岁 NZ$14.99；2 岁及以上 NZ$24.99；成人及 1 岁以下免费。上课日未满 2 岁 NZ$9.99，2 岁及以上 NZ$14.99。须穿店内安全袜。', priceEn: 'Under 2 NZ$14.99; 2 and over NZ$24.99; adults and under 1 free. School-day special: under 2 NZ$9.99, 2 and over NZ$14.99. Grip socks required.', ages: '大约 10 岁及以下；幼儿区仅限 5 岁以下', agesEn: 'About 10 and under; the toddler zone is under 5 only', url: 'https://jagotown.co.nz/', description: '室内攀爬、滑梯和丛林主题游乐，另有幼儿区。', descriptionEn: 'Indoor climbing, slides and jungle-themed play, with a separate toddler zone.' },
  { id: 'chipmunks-hamilton', category: 'indoor', name: 'Chipmunks Hamilton', zh: 'Chipmunks 花栗鼠室内乐园', area: 'Pukete', areaEn: 'Pukete', address: '8 Maui Street, Pukete, Hamilton 3200', phone: '+64 7 848 2421', hours: '每天 9:30–17:00', hoursEn: 'Daily 9:30am–5:00pm', price: '1–2 岁 NZ$19.90；3–11 岁 NZ$22.90；成人及 1 岁以下免费。上课日特价 NZ$19.90（不含公众假期和学校假期）。', priceEn: 'Ages 1–2 NZ$19.90; ages 3–11 NZ$22.90; adults and under 1 free. School-day special NZ$19.90, excluding public and school holidays.', ages: '0–11 岁', agesEn: 'Ages 0–11', url: 'https://chipmunksplayland.co.nz/hamilton/', description: '室内软体游乐，适合 0–11 岁。', descriptionEn: 'Indoor soft play for ages 0–11.' },
  { id: 'timezone-the-base', category: 'indoor', name: 'Timezone The Base', zh: 'Timezone The Base 街机', area: 'Te Rapa / The Base', areaEn: 'Te Rapa / The Base', address: 'M04, Level 1, The Base, Te Rapa Road and Wairere Drive, Hamilton 3200', phone: '07 981 1465', hours: '周一至周三 10:00–21:00；周四 10:00–22:00；周五 10:00–23:00；周六 9:00–23:00；周日 9:00–21:00（The Base 目录；分店页未列时刻表）', hoursEn: 'Mon–Wed 10:00am–9:00pm; Thu 10:00am–10:00pm; Fri 10:00am–11:00pm; Sat 9:00am–11:00pm; Sun 9:00am–9:00pm (The Base directory; the store page has no timetable)', price: '按游戏收费。全国 Time Play 30 分钟 NZ$20；碰碰车 NZ$6/次；激光枪 NZ$13/人。迷你保龄价未列出。全国价不代表该店每项都有。', priceEn: 'Pay per game. National Time Play is NZ$20 for 30 minutes; bumper cars NZ$6 a ride; laser tag NZ$13 a person. Mini-bowling has no listed price. National prices do not mean every game is at this store.', ages: '请以官网为准', agesEn: 'Check the official website.', url: 'https://www.timezonegames.com/en-nz/locations/north-island/timezone-the-base-hamilton/', description: '街机、奖品和迷你保龄，按游戏或套餐玩。', descriptionEn: 'Arcade games, prizes and mini bowling, paid per game or package.' },
  { id: 'timezone-victoria', category: 'indoor', name: 'Timezone Victoria Street', zh: 'Timezone 维多利亚街店', area: 'Hamilton Central', areaEn: 'Hamilton Central', address: '460 Victoria Street, Hamilton 3204', phone: '(07) 808 3127', hours: '周一至周四 11:00–20:00；周五 11:00–22:00；周六 10:00–22:00；周日 10:00–20:00（页面结构化数据，出发前再确认）', hoursEn: 'Mon–Thu 11:00am–8:00pm; Fri 11:00am–10:00pm; Sat 10:00am–10:00pm; Sun 10:00am–8:00pm (from the page’s structured data; confirm before you go)', price: '按全国 Time Play 等定价收费。这家店的官方清单没有迷你保龄。', priceEn: 'National Time Play pricing. This store’s official list does not include mini bowling.', ages: '请以官网为准', agesEn: 'Check the official website.', url: 'https://www.timezonegames.com/en-nz/locations/north-island/timezone-victoria-street/', description: '市中心街机店，和 The Base 不是同一家。', descriptionEn: 'A central-city arcade, separate from Timezone The Base.' },
  { id: 'fun-zone-hamilton', category: 'indoor', name: 'Fun Zone Hamilton', zh: 'Fun Zone Hamilton', area: 'Hamilton Central', areaEn: 'Hamilton Central', address: 'Level 1, 501 Victoria Street, Centre Place, Hamilton', phone: '07 834 0578', hours: '周日–周三 10:00–21:00；周四–周六 10:00–22:00。密室 11:00 起。', hoursEn: 'Sun–Wed 10:00am–9:00pm; Thu–Sat 10:00am–10:00pm. Escape rooms from 11:00am.', price: '生日套餐从 NZ$30/人。5 岁以下迷你高尔夫 NZ$8。成人迷你高尔夫和激光枪单次价未写全。', priceEn: 'Birthday packages from NZ$30 a person. Mini golf for under 5s is NZ$8. Adult mini-golf and single laser-tag prices are not fully listed.', ages: '迷你高尔夫全龄；激光枪建议 5 岁以上；密室 10 岁起须成人陪同，14 岁以上可单独', agesEn: 'Mini golf is all ages; laser tag is suggested from 5; escape rooms need a paying adult from 10, and 14+ may play alone', url: 'https://fun-zone.co.nz/', description: '迷你高尔夫、激光枪和街机，在 Centre Place。', descriptionEn: 'Mini golf, laser tag and arcade games at Centre Place.' },
  { id: 'inflatable-world', category: 'indoor', name: 'Inflatable World', zh: 'Inflatable World 充气乐园', area: 'Frankton', areaEn: 'Frankton', address: 'Duke Street, Frankton, Hamilton', phone: '07 847 1653', hours: '开放日按周公布，出发前查官网当日时刻表。单次入场 2 小时。', hoursEn: 'Open days are published week by week. Check that day’s timetable. Each session is 2 hours.', price: '5 岁及以上 NZ$18；4 岁及以下 NZ$10；5 岁以下加一位家长 NZ$18；旁观免费。须穿袜子。', priceEn: 'Ages 5+ NZ$18; 4 and under NZ$10; under 5 plus one parent NZ$18; spectators free. Socks required.', ages: '官网写全龄；12 岁以下须成人陪同', agesEn: 'Listed as all ages; under 12s need an adult', url: 'https://www.inflatableworld.co.nz/stadiums/hamilton/', description: '充气游乐。官网同时写 53 与 56 Duke Street，出发前确认入口。', descriptionEn: 'Inflatable play. The site lists both 53 and 56 Duke Street, so confirm the entrance before you go.' },
  { id: 'waterworld', category: 'swim', placeId: 'waterworld', name: 'Waterworld', zh: 'Waterworld 水上中心' },
  { id: 'gallagher-aquatic', category: 'swim', name: 'Gallagher Aquatic Centre', zh: 'Gallagher 水上中心', area: 'Melville', areaEn: 'Melville', address: '22 Collins Road, Melville, Hamilton 3206', phone: '07 958 5890', hours: '周一至周五 6:00–20:00；周六、周日 7:30–20:00', hoursEn: 'Mon–Fri 6:00am–8:00pm; Sat–Sun 7:30am–8:00pm', price: '成人 NZ$7.50；儿童（5–15）NZ$3.70；5 岁以下由已付费成人陪同免费。家庭日票页面有 NZ$16.80 与 NZ$22.40 两档，差额未说明。', priceEn: 'Adult NZ$7.50; child (5–15) NZ$3.70; under 5 free with a paying adult in the water. The family day pass is listed as both NZ$16.80 and NZ$22.40, and the difference is not explained.', ages: '全家，有幼儿池。14 岁以下须陪同。', agesEn: 'All the family, with a toddler pool. Under 14s need an adult.', url: 'https://www.hamiltonpools.co.nz/facilities/gallagher-aquatic-centre', description: '南区市政泳池，有幼儿池和室外游乐场。', descriptionEn: 'The southern city pool, with a toddler pool and an outdoor playground.' },
  { id: 'the-peak', category: 'sport', name: 'The Peak', zh: 'The Peak 运动中心', area: 'Rototuna North', areaEn: 'Rototuna North', address: '60 Kimbrae Drive, Rototuna North, Hamilton 3210', phone: '07 854 0546', hours: '场地可租每天 6:00–22:00。Peak-A-Boo 周三、周五 9:30。空场请先致电确认。', hoursEn: 'Courts can be hired daily 6:00am–10:00pm. Peak-A-Boo is Wednesday and Friday at 9:30. Call first to check a court is free.', price: '休闲入场须先确认有位：成人 NZ$6，18 岁以下 NZ$4。Peak-A-Boo NZ$4。请先致电 07 854 0546。', priceEn: 'Casual entry only if a space is free: adult NZ$6, under 18 NZ$4. Peak-A-Boo NZ$4. Call 07 854 0546 first.', ages: 'Peak-A-Boo 0–5 岁。定期 drop-in 球类为 13 岁以上。', agesEn: 'Peak-A-Boo is ages 0–5. Scheduled drop-in sport is 13 and over.', url: 'https://thepeak.co.nz/', description: '室内球场可和家长一起打，幼儿可参加 Peak-A-Boo。', descriptionEn: 'Indoor courts to play with a parent; little ones can join Peak-A-Boo.' },
  { id: 'the-y-hamilton', category: 'sport', name: 'The Y Hamilton', zh: 'The Y Hamilton', area: 'Hamilton Central', areaEn: 'Hamilton Central', address: '36 Pembroke Street, Hamilton', phone: '07 838 2529', hours: '周一至周五 5:30–21:00；周六、周日 8:00–16:00', hoursEn: 'Mon–Fri 5:30am–9:00pm; Sat–Sun 8:00am–4:00pm', price: 'Community Play NZ$5/孩。休闲球场的儿童票价请以官网为准。', priceEn: 'Community Play is NZ$5 a child. Casual court prices for children: check the official website.', ages: 'Community Play 从爬行到 6 岁；体操 5–12 岁', agesEn: 'Community Play is crawling to age 6; gymnastics is ages 5–12', url: 'https://www.ymcanorth.org.nz/find-your-local/hamilton-recreation-centre/', description: '市中心运动中心，幼儿可周一自由玩，也有体操课。', descriptionEn: 'A central recreation centre, with Monday free play for little ones and gymnastics classes.' },
  { id: 'waikato-tennis', category: 'sport', name: 'Waikato Tennis Centre', zh: '怀卡托网球中心', area: 'Hamilton East', areaEn: 'Hamilton East', address: '60 Old Farm Road, Hamilton East', phone: '027 290 7290', hours: '每天 6:00–22:00', hoursEn: 'Daily 6:00am–10:00pm', price: '室内每片每小时 NZ$40；室外非会员每片每小时 NZ$16。须先在 Pay2Play 订场。', priceEn: 'Indoor courts NZ$40 an hour; outdoor casual hire NZ$16 an hour. Book first on Pay2Play.', ages: '请以官网为准', agesEn: 'Check the official website.', url: 'https://clubspark.kiwi/waikatotennistrust', description: '室内外网球场，非会员也可以网上订场。', descriptionEn: 'Indoor and outdoor tennis courts that non-members can book online.' },
  { id: 'topspin-pickleball', category: 'sport', name: 'Topspin Pickleball', zh: 'Topspin 匹克球', area: 'Te Rapa', areaEn: 'Te Rapa', address: '15 Maxwell Place, Building 2, Te Rapa, Hamilton', phone: '027 867 7746', hours: '请以官网为准', hoursEn: 'Check the official website.', price: '请以官网为准', priceEn: 'Check the official website.', ages: 'Junior 项目 6–16 岁。更小的孩子是否可进场，官网未写。', agesEn: 'Junior sessions are ages 6–16. Whether younger children can play is not stated.', url: 'https://www.topspinpickleball.co.nz/about', description: '专用匹克球场，按排期预订。', descriptionEn: 'A dedicated pickleball centre. Book a session.' },
  { id: 'porritt-stadium', category: 'sport', name: 'Porritt Stadium', zh: 'Porritt 体育场', area: 'Chartwell', areaEn: 'Chartwell', address: '78 Crosby Road, Chartwell, Hamilton 3210', phone: '+64 7 838 6699', hours: '跑道或 2 号场没有预订时对公众开放。出发前请查当期预订表。大门时间未写明。', hoursEn: 'The track is open to the public when the track or field 2 is not booked. Check the current booking sheet. Gate hours are not stated.', price: '未见休闲门票', priceEn: 'No casual admission fee is listed.', ages: '请以官网为准', agesEn: 'Check the official website.', url: 'https://hamilton.govt.nz/community-spaces/sports-parks/detail/porritt-stadium/', description: '没有比赛或训练占用时，可以在跑道上跑步或走路。', descriptionEn: 'Run or walk the track when it is not booked for sport or training.' },
  { id: 'bowl-and-social', category: 'sport', name: 'Bowl & Social', zh: 'Bowl & Social', area: 'Hamilton Central', areaEn: 'Hamilton Central', address: 'Level Two, 346 Victoria Street, Hamilton Central, Hamilton 3204', phone: '+64 7 838 3926', hours: '周一至周四 11:00–21:00；周五 11:00–23:00；周六 10:00–23:00；周日 10:00–21:00', hoursEn: 'Mon–Thu 11:00am–9:00pm; Fri 11:00am–11:00pm; Sat 10:00am–11:00pm; Sun 10:00am–9:00pm', price: '一局：儿童 NZ$16，成人 NZ$20（2026-09-01 起，含鞋和球）。儿童为 14 岁及以下。', priceEn: 'One game: child NZ$16, adult NZ$20 (from 1 September 2026, shoes and ball included). Child prices are 14 and under.', ages: '家庭友好。14 岁以下不可无人看管。', agesEn: 'Family friendly. Under 14s cannot be left unsupervised.', url: 'https://skycityhamilton.co.nz/eat-drink/bowl-and-social/', description: '打保龄，另有街机和空气曲棍球。', descriptionEn: 'Bowling, plus arcade games and air hockey.' },
  { id: 'extreme-edge', category: 'climb', name: 'Extreme Edge ClimbZone', zh: 'Extreme Edge ClimbZone 攀岩', area: 'Frankton', areaEn: 'Frankton', address: '90 Greenwood Street, Frankton, Hamilton 3204', phone: '07 847 5858', hours: '学期周一至周五 9:00–21:30；周六、周日 9:00–17:00', hoursEn: 'School-term Mon–Fri 9:00am–9:30pm; Sat–Sun 9:00am–5:00pm', price: '当日票含 ClimbZone：5 岁以下 NZ$15；5–15 岁 NZ$21；成人 NZ$23', priceEn: 'A day pass includes ClimbZone: under 5 NZ$15; ages 5–15 NZ$21; adult NZ$23', ages: 'ClimbZone 从 3 岁起。16 岁以下须成人看管。', agesEn: 'ClimbZone is from age 3. Under 16s need an adult with them.', url: 'https://www.extremeedgehamilton.co.nz/', description: '儿童主题攀岩墙，当日票可多次进出。', descriptionEn: 'A children’s climbing wall. A day pass allows repeat entry that day.' },
  { id: 'boulder-co', category: 'climb', name: 'Boulder Co.', zh: 'Boulder Co. 抱石', area: 'Te Rapa', areaEn: 'Te Rapa', address: '15 Maxwell Place, Te Rapa, Hamilton 3200', phone: '07 949 9935', hours: '周一至周五 9:00–22:00；周六、周日及公众假期 9:00–20:00', hoursEn: 'Mon–Fri 9:00am–10:00pm; Sat, Sun and public holidays 9:00am–8:00pm', price: '当日票：成人 NZ$23；5–12 岁 NZ$17。租鞋 NZ$5。', priceEn: 'Day pass: adult NZ$23; ages 5–12 NZ$17. Shoe hire NZ$5.', ages: '最低 5 岁', agesEn: 'Minimum age 5', url: 'https://www.boulderco.co.nz/locations/hamilton/your-visit/', description: '室内抱石，可以不用预约直接去。', descriptionEn: 'Indoor bouldering. Turn up without a booking.' },
  { id: 'ninja-valley', category: 'climb', name: 'Ninja Valley', zh: 'Ninja Valley 障碍', area: 'Frankton', areaEn: 'Frankton', address: '9–11 Norton Road, Frankton, Hamilton', phone: '0800 646528', hours: '周一 10:00–17:00；周二至周五 10:00–18:00；周六 9:00–18:00；周日 10:00–18:00。场次整点开始。', hoursEn: 'Mon 10:00am–5:00pm; Tue–Fri 10:00am–6:00pm; Sat 9:00am–6:00pm; Sun 10:00am–6:00pm. Sessions start on the hour.', price: '6 岁及以上：1 小时 NZ$22；2 小时 NZ$37', priceEn: 'Ages 6 and over: NZ$22 for 1 hour; NZ$37 for 2 hours', ages: '主场地 6 岁及以上。6 岁以下仅限平日 10:00–12:00 的 Lil\' Ninja，须家长陪同。', agesEn: 'The main course is priced for ages 6 and over. Under 6s are limited to weekday 10:00am–12:00pm Lil\' Ninja sessions with a parent.', url: 'https://ninjavalley.co.nz/hamilton/pricing', description: '室内障碍赛道，按小时玩。', descriptionEn: 'An indoor obstacle course, paid by the hour.' },
  { id: 'prodrive-golf', category: 'climb', name: 'Prodrive Golf', zh: 'Prodrive 高尔夫', area: 'Whitiora', areaEn: 'Whitiora', address: 'Beetham Park, Ulster Street, Hamilton', phone: '07 834 2000', hours: '主店页：周一至周五 9:00–21:00；周六 8:00–21:00；周日 9:00–19:00。各页时刻略有出入，出发前再看官网。', hoursEn: 'The main page says Mon–Fri 9:00am–9:00pm, Sat 8:00am–9:00pm, Sun 9:00am–7:00pm. Other pages differ slightly, so check before you go.', price: '迷你高尔夫 18 洞：成人 NZ$18；儿童（5–14）NZ$15；4 岁及以下免费', priceEn: '18-hole mini golf: adult NZ$18; child (5–14) NZ$15; 4 and under free', ages: '4 岁及以下迷你高尔夫免费', agesEn: 'Mini golf is free for ages 4 and under', url: 'https://www.prodrive.co.nz/pages/hamilton-prodrive-golf', description: '18 洞迷你高尔夫和有顶练习场。', descriptionEn: '18-hole mini golf and a covered driving range.' },
  { id: 'waikato-museum', category: 'learn', placeId: 'waikato-museum', name: 'Waikato Museum', zh: '怀卡托博物馆与美术馆', price: '常设展免费。Exscite：成人日票 NZ$6；儿童（3–15）日票 NZ$11；2 岁及以下免费；家庭日票 NZ$29。', priceEn: 'Permanent galleries are free. Exscite: adult day pass NZ$6; child (3–15) day pass NZ$11; 2 and under free; family day pass NZ$29.', ages: '常设展全龄。Exscite 面向儿童，3–15 岁有儿童票。', agesEn: 'Permanent galleries are all ages. Exscite is for children, with a child ticket for ages 3–15.', description: '常设展看本地历史，Exscite 是收费的儿童动手科学区。', descriptionEn: 'The permanent galleries cover local history. Exscite is a paid hands-on science space for children.' },
  { id: 'classics-museum', category: 'learn', name: 'Classics Museum', zh: 'Classics 博物馆', area: 'Dinsdale', areaEn: 'Dinsdale', address: '11 Railside Place, Hamilton', phone: '(07) 957 2230', hours: '每天 8:00–15:00（官网）', hoursEn: 'Daily 8:00am–3:00pm (official site)', price: '请以官网为准', priceEn: 'Check the official website.', ages: '官网写全龄', agesEn: 'The site says all ages', url: 'https://www.classicsmuseum.co.nz/visit', description: '看经典车，旁边有 1950 年代主题餐厅。', descriptionEn: 'Classic cars, with a 1950s-themed diner next door.' },
  { id: 'central-library', category: 'learn', placeId: 'central-library', name: 'Hamilton Central Library', zh: '汉密尔顿中央图书馆' },
  { id: 'hamilton-zoo', category: 'outdoors', placeId: 'hamilton-zoo', name: 'Hamilton Zoo', zh: '汉密尔顿动物园' },
  { id: 'hamilton-gardens', category: 'outdoors', placeId: 'hamilton-gardens', name: 'Hamilton Gardens', zh: '汉密尔顿花园' },
  { id: 'hamilton-lake', category: 'outdoors', placeId: 'hamilton-lake', name: 'Hamilton Lake Domain', zh: '汉密尔顿湖公园' },
  { id: 'waiwhakareke', category: 'outdoors', placeId: 'waiwhakareke', name: 'Waiwhakareke Natural Heritage Park', zh: 'Waiwhakareke 自然遗产公园' },
  { id: 'kaipaki-farmyard', category: 'outdoors', name: 'Kaipaki Farmyard', zh: 'Kaipaki 农场', area: 'Ōhaupō', areaEn: 'Ōhaupō', address: '515 Kaipaki Road, Ōhaupō', phone: '027 223 5687', hours: '周三至周日：周三–周五 9:30–14:00；周六、周日 9:30–15:00。周一、周二通常关闭。', hoursEn: 'Wednesday to Sunday: Wed–Fri 9:30am–2:00pm; Sat–Sun 9:30am–3:00pm. Usually closed Monday and Tuesday.', price: '成人 NZ$16；学龄前（1–4）NZ$10；儿童（5–16）NZ$12', priceEn: 'Adult NZ$16; preschool (1–4) NZ$10; child (5–16) NZ$12', ages: '全家，未写年龄上限', agesEn: 'All the family. No upper age is stated.', url: 'https://www.kaipakifarmyard.co.nz/', description: '可以摸动物、走农场步道。门牌来自 Tourism NZ（农场提供），官网联系页未写。', descriptionEn: 'Pat the animals and walk the farm trails. The street number is from Tourism NZ, supplied by the farm; the contact page does not print it.' },
  { id: 'hamilton-model-engineers', category: 'outdoors', name: 'Hamilton Model Engineers', zh: 'Hamilton Model Engineers 小火车', area: 'Forest Lake', areaEn: 'Forest Lake', address: 'Minogue Park, end of Tui Avenue, Forest Lake, Hamilton', phone: '07 846 1928', hours: '每月每个周日，天气允许时 10:30–15:00（12:00–12:30 休息）', hoursEn: 'Every Sunday of the month, weather permitting, 10:30am–3:00pm (break 12:00–12:30)', price: '单次 NZ$3；2 岁以下免费，须与付费乘客同行。只收现金和 EFTPOS。', priceEn: 'NZ$3 a ride; under 2 free when travelling with a paying passenger. Cash and EFTPOS only.', ages: '不分年龄；2 岁以下免费乘车', agesEn: 'All ages; under 2s ride free', url: 'https://www.hme.co.nz/running-days-and-pricing/', description: '在 Minogue Park 坐微型小火车。', descriptionEn: 'Ride the miniature railway in Minogue Park.' },
  { id: 'magical-bridge', category: 'outdoors', placeId: 'magical-bridge', name: 'Magical Bridge Destination Playground', zh: 'Magical Bridge 无障碍游乐场', phone: '+64 7 838 6699', ages: '全龄无障碍，残障与非残障儿童可一起玩', agesEn: 'Fully accessible for all ages, for disabled and non-disabled children together' },
  { id: 'parana-park', category: 'outdoors', name: 'Parana Park', zh: 'Parana 公园', area: 'Hamilton East', areaEn: 'Hamilton East', address: 'Memorial Drive, Hamilton East, Hamilton', phone: '+64 7 838 6699', hours: '请以官网为准', hoursEn: 'Check the official website.', price: '免费', priceEn: 'Free', ages: '请以官网为准', agesEn: 'Check the official website.', url: 'https://hamilton.govt.nz/community-spaces/playgrounds/detail/parana-park-destination-playground/', description: '大型冒险游乐场，有花形滑梯、种子喷泉和河边步道。', descriptionEn: 'A large adventure playground, with flower slides, a seed fountain and riverside paths.' },
  { id: 'melville-park', category: 'skate', name: 'Melville Park', zh: 'Melville 公园', area: 'Melville', areaEn: 'Melville', address: 'Melville Park, Bader Street, Hamilton', phone: '+64 7 838 6699', hours: '公园开关时间未写明。周日 10:00–12:00 为轮滑俱乐部公众场。', hoursEn: 'Park gate hours are not stated. Sunday 10:00am–12:00pm is the roller-skating club’s public session.', price: '公园免费。轮滑票价请以官网为准。', priceEn: 'The park is free. Roller-skating admission: check the official website.', ages: '请以官网为准', agesEn: 'Check the official website.', url: 'https://hamilton.govt.nz/community-spaces/sports-parks/detail/melville-park/', description: '滑板碗、泵道和游乐场。带小朋友时注意免牵引遛狗区是分开的。', descriptionEn: 'A skate bowl, pump track and playground. The off-leash dog area is separate, so keep children clear of it.' },
  { id: 'hillcrest-pump', category: 'skate', name: 'Hillcrest Stadium pump track', zh: 'Hillcrest Stadium 泵道', area: 'Hillcrest', areaEn: 'Hillcrest', address: 'Cambridge Road, Hillcrest, Hamilton', phone: '+64 7 838 6699', hours: '请以官网为准', hoursEn: 'Check the official website.', price: '免费', priceEn: 'Free', ages: '请以官网为准', agesEn: 'Check the official website.', url: 'https://hamilton.govt.nz/community-spaces/parks/detail/hillcrest-stadium', description: '柏油自行车道和泵道，适合学骑车、滑步车。', descriptionEn: 'A sealed bike track and pump track for learning to ride or scoot.' },
  { id: 'elliott-park', category: 'skate', name: 'Elliott Park', zh: 'Elliott 公园', area: 'Nawton', areaEn: 'Nawton', address: 'Elliott Park, Nawton, Hamilton', phone: '+64 7 838 6699', hours: '请以官网为准', hoursEn: 'Check the official website.', price: '免费', priceEn: 'Free', ages: '请以官网为准', agesEn: 'Check the official website.', url: 'https://hamilton.govt.nz/community-spaces/playgrounds/detail/elliott-park', description: '滑板场、半场篮球和游乐场。', descriptionEn: 'A skatepark, half-court basketball and a playground.' },
  { id: 'chedworth-bowl', category: 'skate', name: 'Chedworth mini bowl', zh: 'Chedworth 迷你碗池', area: 'Chedworth', areaEn: 'Chedworth', address: 'Chedworth Avenue, Chedworth, Hamilton', phone: '+64 7 838 6699', hours: '请以官网为准', hoursEn: 'Check the official website.', price: '免费', priceEn: 'Free', ages: '请以官网为准', agesEn: 'Check the official website.', url: 'https://hamilton.govt.nz/community-spaces/playgrounds/detail/chedworth-park/', description: '小型游乐场和迷你滑板碗，适合初学。', descriptionEn: 'A small playground and mini skate bowl for beginners.' },
  { id: 'fairfield-skatepark', category: 'skate', name: 'Fairfield Skatepark', zh: 'Fairfield 滑板场', area: 'Fairfield', areaEn: 'Fairfield', address: 'Fairfield Park, Fairfield, Hamilton', phone: '+64 7 838 6699', hours: '请以官网为准', hoursEn: 'Check the official website.', price: '免费', priceEn: 'Free', ages: '面向各级骑手，含初学者', agesEn: 'For riders of all levels, including beginners', url: 'https://hamilton.govt.nz/strategies-plans-and-projects/projects/city-wide-community/fairfield-skate-park-refresh', description: '刷新后的滑板场，也有半场篮球和遮荫。', descriptionEn: 'The refreshed skatepark, with half-court basketball and shade.' },
];

export const OUTING_CARD_PHOTOS = [
  {
    id: 'classics-museum',
    photo: 'classics-museum.webp',
    photoAlt: 'Hamilton Classics Museum 里的 Diamond T Texaco 油罐车',
    photoAltEn: 'Diamond T Texaco tanker at Hamilton Classics Museum',
    photoCredit: 'Sleeps-Darkly',
    photoLicense: 'CC BY-SA 4.0',
    photoLicenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Diamond_T_Texaco,_Hamilton_Classic_Car_Museum,_2023-11-24.jpg',
    zh: 'Classics 博物馆',
    en: 'Classics Museum',
  },
  {
    id: 'hamilton-model-engineers',
    photo: 'hamilton-model-engineers.webp',
    photoAlt: 'Minogue Park 的 Hamilton Model Engineers 小火车轨道',
    photoAltEn: 'Hamilton Model Engineers track at Minogue Park',
    photoCredit: 'Johnragla',
    photoLicense: 'CC BY-SA 4.0',
    photoLicenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Model_Engineers_Club_at_Minogue_Park,_Hamilton.jpg',
    zh: 'Hamilton Model Engineers 小火车',
    en: 'Hamilton Model Engineers',
  },
  {
    id: 'parana-park',
    photo: 'parana-park.webp',
    photoAlt: 'Hamilton East 的 Parana 公园步道',
    photoAltEn: 'Walkway at Parana Park, Hamilton East',
    photoCredit: 'Nzwj',
    photoLicense: 'CC BY 3.0',
    photoLicenseUrl: 'https://creativecommons.org/licenses/by/3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:ParanaParkHamilton.JPG',
    zh: 'Parana 公园',
    en: 'Parana Park',
  },
] as const;

function withCardPhoto<T extends { en: object }>(place: T, id: string): T {
  const photo = OUTING_CARD_PHOTOS.find(item => item.id === id);
  if (!photo) return place;
  return {
    ...place,
    photo: photo.photo,
    photoAlt: photo.photoAlt,
    photoCredit: photo.photoCredit,
    photoLicense: photo.photoLicense,
    photoLicenseUrl: photo.photoLicenseUrl,
    photoSource: photo.photoSource,
    en: { ...place.en, photoAlt: photo.photoAltEn },
  };
}

export function familyOutings() {
  return SPECS.map(spec => {
    const cat = OUTING_CATEGORIES.find(item => item.id === spec.category)!;
    const base = spec.placeId ? PLACES.find(place => place.id === spec.placeId) : undefined;
    if (base) {
      const en = { ...base.en };
      if (spec.hoursEn) en.hours = spec.hoursEn;
      if (spec.priceEn) en.price = spec.priceEn;
      if (spec.descriptionEn) en.description = spec.descriptionEn;
      if (spec.areaEn) en.area = spec.areaEn;
      return {
        ...base,
        ...(spec.area ? { area: spec.area } : {}),
        ...(spec.address ? { address: spec.address } : {}),
        ...(spec.hours ? { hours: spec.hours } : {}),
        ...(spec.price ? { price: spec.price } : {}),
        ...(spec.description ? { description: spec.description } : {}),
        ...(spec.url ? { url: spec.url } : {}),
        phone: spec.phone,
        ages: spec.ages,
        agesEn: spec.agesEn,
        categoryId: spec.category,
        categoryZh: cat.zh,
        categoryEn: cat.en,
        en,
      };
    }
    return {
      id: spec.id,
      name: spec.name,
      zh: spec.zh,
      area: spec.area || '',
      address: spec.address || '',
      indoor: spec.category === 'indoor' || spec.category === 'learn' || spec.category === 'swim' || spec.category === 'sport' || spec.category === 'climb',
      free: spec.price === '免费',
      tag: cat.zh,
      description: spec.description || '',
      hours: spec.hours,
      price: spec.price,
      url: spec.url,
      phone: spec.phone,
      km: null as number | null,
      categoryId: spec.category,
      categoryZh: cat.zh,
      categoryEn: cat.en,
      ages: spec.ages,
      agesEn: spec.agesEn,
      en: {
        tag: cat.en,
        description: spec.descriptionEn || '',
        area: spec.areaEn || spec.area || '',
        hours: spec.hoursEn,
        price: spec.priceEn,
      },
    };
  }).map(place => withCardPhoto(place, place.id));
}
