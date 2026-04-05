
export const getImageUrl = (blog: any) => {
  const category = blog?.category?.toLowerCase() || "default";

  const categoryImages: Record<string, string[]> = {
    technology: [
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=900&auto=format&fit=crop", // laptop purple light
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop", // circuit board closeup
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&auto=format&fit=crop", // macbook code
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=900&auto=format&fit=crop", // retro monitors
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&auto=format&fit=crop", // open office screens
      "https://images.unsplash.com/photo-1562408590-e32931084e23?w=900&auto=format&fit=crop", // blue server room
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=900&auto=format&fit=crop", // person using tablet
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop", // matrix green code
      "https://images.unsplash.com/photo-1597589827317-4c6d6e0a90bd?w=900&auto=format&fit=crop", // dark keyboard glow
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&auto=format&fit=crop", // AI abstract
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&auto=format&fit=crop", // team with laptops
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&auto=format&fit=crop", // woman with hologram
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop", // globe network
      "https://images.unsplash.com/photo-1480694313141-fce5e697ee25?w=900&auto=format&fit=crop", // abstract data lines
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=900&auto=format&fit=crop", // clean desk setup
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=900&auto=format&fit=crop", // graph on screen
      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=900&auto=format&fit=crop", // fiber optic cables
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&auto=format&fit=crop", // server racks
      "https://images.unsplash.com/photo-1617042375876-a13e36732a04?w=900&auto=format&fit=crop", // phone UI abstract
      "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=900&auto=format&fit=crop", // screens display room
    ],
    health: [
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop", // stethoscope
      "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop", // healthcare icons
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop", // runner silhouette
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&auto=format&fit=crop", // brain scan
      "https://images.unsplash.com/photo-1493210977954-28f5c2b6ab18?w=800&auto=format&fit=crop", // green salad bowl
      "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop", // doctor hands
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop", // healthy meal prep
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&auto=format&fit=crop", // yoga silhouette sunset
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop", // woman meditating
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop", // medical team
      "https://images.unsplash.com/photo-1467453678174-768ec283a940?w=800&auto=format&fit=crop", // dumbbell weights
      "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=800&auto=format&fit=crop", // fresh vegetables
      "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=800&auto=format&fit=crop", // lab test tubes
      "https://images.unsplash.com/photo-1554734867-bf3c00a49371?w=800&auto=format&fit=crop", // pills and medicine
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop", // doctor consultation
      "https://images.unsplash.com/photo-1484863137850-59afcfe05386?w=800&auto=format&fit=crop", // couple jogging
      "https://images.unsplash.com/photo-1470468969717-61d5d54fd036?w=800&auto=format&fit=crop", // green smoothie
      "https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=800&auto=format&fit=crop", // morning stretch
      "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&auto=format&fit=crop", // hospital corridor
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop", // peaceful wellness
    ],
    finance: [
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop", // stock chart screen
      "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&auto=format&fit=crop", // trading charts
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop", // gold bars
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop", // tax paperwork
      "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&auto=format&fit=crop", // credit cards
      "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&auto=format&fit=crop", // coins jar
      "https://images.unsplash.com/photo-1565514020179-026b92b2d70b?w=800&auto=format&fit=crop", // graph notebook
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop", // city financial district
      "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&auto=format&fit=crop", // coins stacked
      "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&auto=format&fit=crop", // bitcoin crypto
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop", // calculator finance
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop", // stock market board
      "https://images.unsplash.com/photo-1622186477895-f2af6a0f5a97?w=800&auto=format&fit=crop", // dollar bills
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop", // analytics laptop
      "https://images.unsplash.com/photo-1619983081563-430f63602796?w=800&auto=format&fit=crop", // piggy bank saving
      "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&auto=format&fit=crop", // data charts desk
      "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=800&auto=format&fit=crop", // hands holding money
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop", // businessman suit
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop", // signing contract
      "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800&auto=format&fit=crop", // bank vault door
    ],
    politics: [
      "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop", // microphone podium
      "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&auto=format&fit=crop", // vote sign
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop", // crowd protest
      "https://images.unsplash.com/photo-1575320181282-9afab399332c?w=800&auto=format&fit=crop", // government building
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop", // people in meeting
      "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=800&auto=format&fit=crop", // ballot box
      "https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?w=800&auto=format&fit=crop", // law books gavel
      "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&auto=format&fit=crop", // flags waving
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&auto=format&fit=crop", // city parliament
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800&auto=format&fit=crop", // handshake deal
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop", // world map
      "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop", // newspaper politics
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop", // conference room
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop", // press conference mics
      "https://images.unsplash.com/photo-1607988795691-3d0147b43231?w=800&auto=format&fit=crop", // UN assembly hall
      "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800&auto=format&fit=crop", // debate stage lights
      "https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&auto=format&fit=crop", // abstract globe
      "https://images.unsplash.com/photo-1509822929063-6b6723709747?w=800&auto=format&fit=crop", // people voting queue
      "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&auto=format&fit=crop", // pen on document law
      "https://images.unsplash.com/photo-1580130775562-0ef92da028de?w=800&auto=format&fit=crop", // speech crowd aerial
    ],
    sports: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop", // athlete track blur
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format&fit=crop", // runner road morning
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop", // stadium aerial empty
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&auto=format&fit=crop", // olympic podium
      "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800&auto=format&fit=crop", // athlete silhouette sunset
      "https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=800&auto=format&fit=crop", // trophy close up
      "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&auto=format&fit=crop", // team huddle hands
      "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=800&auto=format&fit=crop", // sneakers running
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=800&auto=format&fit=crop", // crowd stadium lights
      "https://images.unsplash.com/photo-1583308153024-b8da8af6b9f8?w=800&auto=format&fit=crop", // weights gym generic
      "https://images.unsplash.com/photo-1434648957308-5e6a859697e8?w=800&auto=format&fit=crop", // person jumping silhouette
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&auto=format&fit=crop", // finish line tape
      "https://images.unsplash.com/photo-1519766304817-4f37bda74a26?w=800&auto=format&fit=crop", // scoreboard generic
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop", // cyclist road
      "https://images.unsplash.com/photo-1541534722566-4c453e0f4949?w=800&auto=format&fit=crop", // swimmer pool lanes
      "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=800&auto=format&fit=crop", // boxing gloves hanging
      "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=800&auto=format&fit=crop", // athlete warming up
      "https://images.unsplash.com/photo-1576458088443-04a19bb13da6?w=800&auto=format&fit=crop", // medal close up
      "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&auto=format&fit=crop", // team celebration generic
      "https://images.unsplash.com/photo-1540200049-99a67f5f5ece?w=800&auto=format&fit=crop", // sport equipment flat lay
    ],
    travel: [
      "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=900&auto=format&fit=crop", // mountain road trip
      "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=900&auto=format&fit=crop", // boat clear water
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&auto=format&fit=crop", // lake gondola
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&auto=format&fit=crop", // camper van road
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&auto=format&fit=crop", // lake mountains reflection
      "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=900&auto=format&fit=crop", // compass map planning
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop", // tropical beach aerial
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=900&auto=format&fit=crop", // old city street
      "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=900&auto=format&fit=crop", // woman overlooking view
      "https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?w=900&auto=format&fit=crop", // airport terminal
      "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=900&auto=format&fit=crop", // hiking trail forest
      "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=900&auto=format&fit=crop", // airplane wing clouds
      "https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?w=900&auto=format&fit=crop", // desert dunes
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=900&auto=format&fit=crop", // backpacker silhouette
      "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=900&auto=format&fit=crop", // tent camping stars
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=900&auto=format&fit=crop", // passport luggage map
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&auto=format&fit=crop", // hotel lobby luxury
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=900&auto=format&fit=crop", // world globe travel
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&auto=format&fit=crop", // infinity pool view
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&auto=format&fit=crop", // sneakers travel road
    ],
    food: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&auto=format&fit=crop", // colorful plates overhead
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&auto=format&fit=crop", // pancakes syrup
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&auto=format&fit=crop", // pizza close up
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=900&auto=format&fit=crop", // toast eggs breakfast
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&auto=format&fit=crop", // colorful salad bowl
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=900&auto=format&fit=crop", // pasta fork twirl
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&auto=format&fit=crop", // fine dining plate
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=900&auto=format&fit=crop", // sushi rolls
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&auto=format&fit=crop", // burger close up
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&auto=format&fit=crop", // healthy veg bowl
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&auto=format&fit=crop", // meal prep containers
      "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=900&auto=format&fit=crop", // breakfast spread overhead
      "https://images.unsplash.com/photo-1464306208223-e0b4495a5621?w=900&auto=format&fit=crop", // coffee latte art
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=900&auto=format&fit=crop", // kitchen cooking pan
      "https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=900&auto=format&fit=crop", // sourdough bread
      "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=900&auto=format&fit=crop", // tacos street food
      "https://images.unsplash.com/photo-1504544750208-dc0358e35284?w=900&auto=format&fit=crop", // chocolate dessert
      "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=900&auto=format&fit=crop", // ramen bowl
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=900&auto=format&fit=crop", // grilled meat bbq
      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=900&auto=format&fit=crop", // french toast berries
    ],
    default: [
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1542396601-dca920ea2807?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1504465390-9c2f616a2b77?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1500989145603-8e7ef71d639e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1523289333742-be1143f6b766?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1488998527040-85054a85150e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1504796126897-7c45b279f888?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop",
    ],
  };

  const images = categoryImages[category] || categoryImages.default;
  const hashString = blog?.title || String(Math.random());
  const hash = hashString?.split("")?.reduce((acc: number, char: string) => acc + char?.charCodeAt(0), 0);
  const randomIndex = hash % images?.length;
  return !blog?.thumbnail?.image?.includes('thekhabarexpress.s3.ap-southeast-2') ? blog?.thumbnail?.image : images?.[randomIndex];
};

export const formatDate = (dateString?: Date | string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatShortDate = (dateString?: Date | string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const getRandomFallbackImage = () => {
  const images = [
    "https://images.unsplash.com/photo-1624269305548-1527ef905ff6?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1635156219587-879ded59e273?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&auto=format&fit=crop"
  ];
  return images[Math.floor(Math.random() * images.length)];
};
