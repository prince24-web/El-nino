// Grounded Nigerian Agronomic Knowledge Base
// Extracted and optimized for serverless edge inference

export interface Crop {
  id: number;
  name: string;
  local_names?: string;
  growing_zones?: string;
  planting_months?: string;
  harvest_months?: string;
  soil_type?: string;
  water_needs?: string;
  yield_per_hectare?: string;
  notes?: string;
  [key: string]: any;
}

export interface Pest {
  id: number;
  name: string;
  type?: string;
  affected_crops?: string;
  symptoms?: string;
  prevention?: string;
  local_name?: string;
  [key: string]: any;
}

export interface Treatment {
  id: number;
  pest_id: number;
  method?: string;
  product_name?: string;
  dosage?: string;
  cost_naira?: string;
  availability?: string;
  organic?: number;
  product_detail?: string;
  [key: string]: any;
}

export interface Fertilizer {
  id: number;
  crop_id: number;
  fertilizer_name?: string;
  npk_ratio?: string;
  application_stage?: string;
  kg_per_hectare?: number | string;
  timing_weeks?: string;
  cost_naira_per_bag?: string;
  [key: string]: any;
}

export interface MarketPrice {
  id: number;
  crop_id: number;
  region?: string;
  market_name?: string;
  price_per_kg_naira?: number | string;
  price_per_bag_naira?: number | string;
  trend?: string;
  last_updated?: string;
  [key: string]: any;
}

export const CROPS: Crop[] = [
  {
    "id": 1,
    "name": "Cassava",
    "local_names": "Akpu, Ege, Rogo, Gbaguda",
    "growing_zones": "South-South, South-East, South-West, North-Central",
    "planting_months": "March-April, September-October",
    "harvest_months": "12-18 months after planting",
    "soil_type": "Sandy loam, well-drained",
    "water_needs": "Low to moderate \u2014 drought tolerant",
    "yield_per_hectare": "10-25 tonnes/ha",
    "notes": "Most widely grown crop in Nigeria. Versatile: garri, fufu, starch."
  },
  {
    "id": 2,
    "name": "Maize",
    "local_names": "Agbado, Masara, Oka",
    "growing_zones": "All zones \u2014 best in derived savanna",
    "planting_months": "March-April (first season), July-August (second season)",
    "harvest_months": "90-120 days after planting",
    "soil_type": "Well-drained loamy soil",
    "water_needs": "Moderate \u2014 needs 500-800mm rainfall",
    "yield_per_hectare": "2-4 tonnes/ha",
    "notes": "Staple food and animal feed. Two seasons per year possible."
  },
  {
    "id": 3,
    "name": "Yam",
    "local_names": "Ji, Isu, Doya",
    "growing_zones": "Middle Belt, South-East, South-West",
    "planting_months": "February-April",
    "harvest_months": "7-9 months after planting",
    "soil_type": "Deep, well-drained loamy soil",
    "water_needs": "Moderate to high",
    "yield_per_hectare": "15-25 tonnes/ha",
    "notes": "High value crop. Requires staking. Store in barn after harvest."
  },
  {
    "id": 4,
    "name": "Tomato",
    "local_names": "Tomati, Gauta",
    "growing_zones": "Kano, Kaduna, Jos Plateau, South-West",
    "planting_months": "October-January (dry season with irrigation), May-June (rainy)",
    "harvest_months": "70-90 days after transplanting",
    "soil_type": "Loamy, slightly acidic pH 5.5-7",
    "water_needs": "High \u2014 needs regular watering",
    "yield_per_hectare": "20-30 tonnes/ha",
    "notes": "Very perishable. Sell quickly or process. High market demand year-round."
  },
  {
    "id": 5,
    "name": "Sorghum",
    "local_names": "Okababa, Dawa, Oka baba",
    "growing_zones": "North-West, North-East, North-Central",
    "planting_months": "May-June",
    "harvest_months": "3-5 months after planting",
    "soil_type": "Sandy loam to clay loam, tolerates poor soil",
    "water_needs": "Low \u2014 highly drought tolerant",
    "yield_per_hectare": "1-3 tonnes/ha",
    "notes": "Excellent for dry north. Used for food, feed, and local brewing."
  },
  {
    "id": 6,
    "name": "Groundnut",
    "local_names": "Epa, Gyada, Okpa",
    "growing_zones": "North-West, North-East, derived savanna",
    "planting_months": "May-July",
    "harvest_months": "90-130 days after planting",
    "soil_type": "Sandy loam, well-drained, pH 5.5-7",
    "water_needs": "Moderate",
    "yield_per_hectare": "1-2 tonnes/ha",
    "notes": "Good for crop rotation \u2014 fixes nitrogen. Oil and protein crop."
  },
  {
    "id": 7,
    "name": "Cowpea",
    "local_names": "Ewa, Wake, Kunde",
    "growing_zones": "All zones \u2014 especially the North",
    "planting_months": "May-July (north), March-April (south)",
    "harvest_months": "60-90 days",
    "soil_type": "Sandy loam, tolerates poor soil",
    "water_needs": "Low \u2014 drought tolerant",
    "yield_per_hectare": "0.5-1.5 tonnes/ha",
    "notes": "Excellent protein source. Good intercrop with maize or sorghum."
  },
  {
    "id": 8,
    "name": "Rice",
    "local_names": "Iresi, Shinkafa, Osikapa",
    "growing_zones": "Niger Delta, Kebbi, Ebonyi, Anambra, Benue",
    "planting_months": "May-June (upland), March (lowland irrigated)",
    "harvest_months": "4-6 months",
    "soil_type": "Clay loam, water-retentive for lowland",
    "water_needs": "High \u2014 needs flooded or moist conditions",
    "yield_per_hectare": "3-6 tonnes/ha",
    "notes": "Demand exceeds supply in Nigeria. High profit but water-intensive."
  },
  {
    "id": 9,
    "name": "Plantain",
    "local_names": "Ogede, Ayaba, Unere",
    "growing_zones": "South-South, South-East, South-West",
    "planting_months": "Any time \u2014 perennial crop",
    "harvest_months": "12-18 months first harvest, ratoons every 9 months",
    "soil_type": "Rich loamy, well-drained",
    "water_needs": "High \u2014 1200mm+ rainfall",
    "yield_per_hectare": "20-40 tonnes/ha",
    "notes": "Perennial \u2014 plant once, harvest for years. Process into chips for longer shelf life."
  },
  {
    "id": 10,
    "name": "Sweet Potato",
    "local_names": "Anamo, Dankali-mai-zaki, Edesi",
    "growing_zones": "All zones \u2014 especially Jos Plateau and South",
    "planting_months": "March-April, August-September",
    "harvest_months": "3-5 months",
    "soil_type": "Sandy loam, well-drained",
    "water_needs": "Moderate",
    "yield_per_hectare": "10-15 tonnes/ha",
    "notes": "Fast growing. Drought tolerant. Good for food security crops."
  },
  {
    "id": 11,
    "name": "Pepper (Hot)",
    "local_names": "Tatashe, Bawa, Ose oyibo",
    "growing_zones": "South-West, South-East, North-Central",
    "planting_months": "March-April (seedbed), transplant after 4-6 weeks",
    "harvest_months": "90-120 days",
    "soil_type": "Loamy, well-drained, pH 6-7",
    "water_needs": "Moderate to high",
    "yield_per_hectare": "5-10 tonnes/ha",
    "notes": "High value. Dry pepper fetches premium price. Sun-dry after harvest."
  },
  {
    "id": 12,
    "name": "Okra",
    "local_names": "Ila, Kubewa, Okwuru",
    "growing_zones": "All zones",
    "planting_months": "March-April, July-August",
    "harvest_months": "55-65 days",
    "soil_type": "Loamy, well-drained",
    "water_needs": "Moderate",
    "yield_per_hectare": "5-8 tonnes/ha",
    "notes": "Fast turnaround. Popular in local cuisine. Fresh and dried markets."
  },
  {
    "id": 13,
    "name": "Melon (Egusi)",
    "local_names": "Egusi, Agushi",
    "growing_zones": "South-West, South-East, North-Central",
    "planting_months": "March-April",
    "harvest_months": "90-120 days",
    "soil_type": "Sandy loam",
    "water_needs": "Low to moderate",
    "yield_per_hectare": "0.8-1.5 tonnes/ha (seed)",
    "notes": "Seeds are the product. High demand in south. Process and bag for shelf life."
  },
  {
    "id": 14,
    "name": "Soybean",
    "local_names": "Soya, Wake-anguku",
    "growing_zones": "Middle Belt \u2014 Benue, Nasarawa, Plateau, Kaduna",
    "planting_months": "June-July",
    "harvest_months": "90-120 days",
    "soil_type": "Loamy, pH 6-7",
    "water_needs": "Moderate",
    "yield_per_hectare": "1-2.5 tonnes/ha",
    "notes": "High protein, high demand from feed mills and food processors."
  },
  {
    "id": 15,
    "name": "Onion",
    "local_names": "Alubosa, Albasa",
    "growing_zones": "Kebbi, Sokoto, Kano, Niger State (dry season)",
    "planting_months": "October-November (dry season)",
    "harvest_months": "90-120 days",
    "soil_type": "Sandy loam, well-drained",
    "water_needs": "High \u2014 needs irrigation in dry season",
    "yield_per_hectare": "15-25 tonnes/ha",
    "notes": "Very high value. Dry season production using irrigation near rivers."
  },
  {
    "id": 16,
    "name": "Banana",
    "local_names": "Ogede wewe, Ayaba",
    "growing_zones": "South-South, South-West, South-East",
    "planting_months": "Perennial \u2014 any time",
    "harvest_months": "9-12 months first bunch",
    "soil_type": "Rich loamy, well-drained",
    "water_needs": "High",
    "yield_per_hectare": "30-50 tonnes/ha",
    "notes": "Similar to plantain. Fresh consumption market. Export potential."
  },
  {
    "id": 17,
    "name": "Watermelon",
    "local_names": "Elegede, Kankana",
    "growing_zones": "North \u2014 Kebbi, Kano, Zamfara, Sokoto",
    "planting_months": "October-January (dry season with irrigation)",
    "harvest_months": "70-90 days",
    "soil_type": "Sandy loam, well-drained",
    "water_needs": "High \u2014 needs irrigation",
    "yield_per_hectare": "20-40 tonnes/ha",
    "notes": "High profit in dry season. Sell fast \u2014 perishable."
  },
  {
    "id": 18,
    "name": "Cocoa",
    "local_names": "Koko, Cocoa",
    "growing_zones": "South-West (Ondo, Osun, Oyo), South-East, South-South",
    "planting_months": "April-June",
    "harvest_months": "3-5 years first harvest, perennial",
    "soil_type": "Deep loamy, humid, pH 6-7",
    "water_needs": "High \u2014 needs 1500mm+ rainfall",
    "yield_per_hectare": "0.5-1.5 tonnes/ha (dry beans)",
    "notes": "Export crop. Long-term investment. FMARD has subsidy programs."
  },
  {
    "id": 19,
    "name": "Millet (Pearl)",
    "local_names": "Gero, Maiwa",
    "growing_zones": "North-West, North-East \u2014 dry arid zones",
    "planting_months": "June-July",
    "harvest_months": "60-90 days",
    "soil_type": "Sandy, poor soil \u2014 very tolerant",
    "water_needs": "Very low \u2014 drought resistant",
    "yield_per_hectare": "0.5-1 tonne/ha",
    "notes": "Survives where others fail. Staple in far north. Food security crop."
  },
  {
    "id": 20,
    "name": "Ginger",
    "local_names": "Citta, Jinja",
    "growing_zones": "Kaduna, Nassarawa, Benue, Gombe",
    "planting_months": "April-May",
    "harvest_months": "8-10 months",
    "soil_type": "Sandy loam, rich organic matter",
    "water_needs": "Moderate to high",
    "yield_per_hectare": "10-20 tonnes/ha (fresh)",
    "notes": "Nigeria is world's largest ginger exporter. High export value."
  }
];

export const PESTS: Pest[] = [
  {
    "id": 1,
    "name": "Cassava Mosaic Disease",
    "local_name": "Arun cassava",
    "type": "Viral disease",
    "affected_crops": "Cassava",
    "symptoms": "Yellow and green mosaic pattern on leaves, leaf distortion, stunted growth, reduced tuber size",
    "severity": "High",
    "season": "Year-round, worse in dry season"
  },
  {
    "id": 2,
    "name": "Cassava Mealybug",
    "local_name": "Udele cassava",
    "type": "Insect pest",
    "affected_crops": "Cassava",
    "symptoms": "White cottony masses on stems and undersides of leaves, yellowing, wilting, sooty mold",
    "severity": "High",
    "season": "Dry season"
  },
  {
    "id": 3,
    "name": "Fall Armyworm",
    "local_name": "Kokoro agbado, Tsutsuma",
    "type": "Insect pest",
    "affected_crops": "Maize, Sorghum, Millet",
    "symptoms": "Ragged holes in leaves, sawdust-like frass in whorl, entire plant defoliation in severe cases",
    "severity": "Very High",
    "season": "Rainy season May-September"
  },
  {
    "id": 4,
    "name": "Maize Streak Virus",
    "local_name": "Arun agbado",
    "type": "Viral disease",
    "affected_crops": "Maize",
    "symptoms": "Yellow streaks running length of leaf, stunting, poor cob formation",
    "severity": "High",
    "season": "Rainy season"
  },
  {
    "id": 5,
    "name": "Tomato Blight (Late)",
    "local_name": "Arun tomati",
    "type": "Fungal disease",
    "affected_crops": "Tomato, Pepper",
    "symptoms": "Dark water-soaked lesions on leaves, white mold on leaf undersides, fruit rot, rapid plant death",
    "severity": "Very High",
    "season": "Rainy season, high humidity"
  },
  {
    "id": 6,
    "name": "Tomato Leaf Miner",
    "local_name": "Kokoro tomati",
    "type": "Insect pest",
    "affected_crops": "Tomato",
    "symptoms": "Winding white mines/trails on leaves, leaf drying, reduced photosynthesis",
    "severity": "Medium",
    "season": "Dry season"
  },
  {
    "id": 7,
    "name": "Yam Beetle",
    "local_name": "Kokoro isu",
    "type": "Insect pest",
    "affected_crops": "Yam",
    "symptoms": "Holes bored into tubers, rotting from entry wounds, yield loss at harvest",
    "severity": "High",
    "season": "Late rainy season"
  },
  {
    "id": 8,
    "name": "Groundnut Rosette Virus",
    "local_name": "Arun epa",
    "type": "Viral disease",
    "affected_crops": "Groundnut",
    "symptoms": "Severe stunting, small chlorotic leaves, bushy appearance, total crop failure possible",
    "severity": "Very High",
    "season": "Rainy season"
  },
  {
    "id": 9,
    "name": "Rice Yellow Mottle Virus",
    "local_name": "Arun shinkafa",
    "type": "Viral disease",
    "affected_crops": "Rice",
    "symptoms": "Yellow streaks on leaves, stunting, empty grains, up to 100% yield loss",
    "severity": "Very High",
    "season": "Rainy season"
  },
  {
    "id": 10,
    "name": "Sorghum Striga",
    "local_name": "Kakariya, Witch weed",
    "type": "Parasitic weed",
    "affected_crops": "Sorghum, Maize, Millet, Cowpea",
    "symptoms": "Stunted yellow plants, wilting despite rain, purple-pink flowering weed emerging from soil near roots",
    "severity": "Very High",
    "season": "Rainy season"
  },
  {
    "id": 11,
    "name": "Pepper Thrips",
    "local_name": "Kokoro ose",
    "type": "Insect pest",
    "affected_crops": "Pepper, Tomato, Onion",
    "symptoms": "Silver streaks on leaves, distorted young leaves, scarred fruits, flower drop",
    "severity": "Medium",
    "season": "Dry season"
  },
  {
    "id": 12,
    "name": "Cowpea Aphid",
    "local_name": "Kokoro ewa",
    "type": "Insect pest",
    "affected_crops": "Cowpea, Groundnut",
    "symptoms": "Clusters of small green/black insects on growing tips, yellowing, honeydew, sooty mold",
    "severity": "Medium",
    "season": "Dry season and early rains"
  },
  {
    "id": 13,
    "name": "Banana/Plantain Black Sigatoka",
    "local_name": "Arun ogede",
    "type": "Fungal disease",
    "affected_crops": "Plantain, Banana",
    "symptoms": "Dark brown-black streaks on leaves expanding to large necrotic areas, premature fruit ripening",
    "severity": "High",
    "season": "Rainy season, high humidity"
  },
  {
    "id": 14,
    "name": "Onion Downy Mildew",
    "local_name": "Arun alubosa",
    "type": "Fungal disease",
    "affected_crops": "Onion",
    "symptoms": "Pale green to yellow patches on leaves, gray-purple fuzzy growth, leaf collapse",
    "severity": "High",
    "season": "Cool humid conditions"
  },
  {
    "id": 15,
    "name": "Locust (Desert)",
    "local_name": "E\u00e9\u1e63\u00fa, Fara",
    "type": "Insect pest",
    "affected_crops": "Maize, Sorghum, Millet, Rice, Cowpea, Groundnut",
    "symptoms": "Complete defoliation of entire fields within hours, bare stalks remaining",
    "severity": "Catastrophic",
    "season": "Dry season \u2014 harmattan period"
  }
];

export const TREATMENTS: Treatment[] = [
  {
    "id": 1,
    "pest_id": 1,
    "method": "Cultural",
    "product_name": "Use CMD-resistant varieties (TME 419, IITA TMS)",
    "product_detail": "Resistant cassava cuttings from IITA or NASC",
    "dosage": "Plant entire field with resistant variety",
    "cost_naira": "\u20a6800-1,500 per bundle of cuttings",
    "availability": "IITA offices, certified seed sellers",
    "notes": "Most effective long-term solution"
  },
  {
    "id": 2,
    "pest_id": 1,
    "method": "Cultural",
    "product_name": "Rogue out infected plants",
    "product_detail": "No product \u2014 manual removal",
    "dosage": "Remove and burn infected plants within 2 weeks of detection",
    "cost_naira": "Free \u2014 labour cost only",
    "availability": "Anywhere",
    "notes": "Remove before whitefly spreads virus further"
  },
  {
    "id": 3,
    "pest_id": 2,
    "method": "Chemical",
    "product_name": "Dimethoate 40% EC",
    "product_detail": "Dimethoate (Rogor, Dimate)",
    "dosage": "2ml per litre of water, spray undersides of leaves",
    "cost_naira": "\u20a6800-1,200 per 100ml",
    "availability": "Agro shops nationwide",
    "notes": "Spray in cool morning hours. Wear gloves."
  },
  {
    "id": 4,
    "pest_id": 2,
    "method": "Biological",
    "product_name": "Introduce natural predator Anagyrus lopezi",
    "product_detail": "Biocontrol agents from IITA Ibadan",
    "dosage": "Release 200-500 wasps per hectare",
    "cost_naira": "Contact IITA \u2014 often free for smallholders",
    "availability": "IITA Ibadan",
    "notes": "Sustainable long-term control"
  },
  {
    "id": 5,
    "pest_id": 3,
    "method": "Chemical",
    "product_name": "Emamectin benzoate 1.9% EC",
    "product_detail": "Coragen, Ampligo, Match",
    "dosage": "0.4ml per litre, spray into whorl of plant",
    "cost_naira": "\u20a61,500-2,500 per 100ml",
    "availability": "Major agro dealers",
    "notes": "Spray early morning. Repeat after 7 days if infestation severe."
  },
  {
    "id": 6,
    "pest_id": 3,
    "method": "Cultural",
    "product_name": "Apply sand or ash into whorl",
    "product_detail": "Wood ash or fine sand",
    "dosage": "1 teaspoon per plant whorl",
    "cost_naira": "Free if ash available",
    "availability": "Anywhere",
    "notes": "Emergency cheap measure. Disrupts larvae feeding."
  },
  {
    "id": 7,
    "pest_id": 3,
    "method": "Chemical",
    "product_name": "Chlorpyrifos 48% EC",
    "product_detail": "Pyrifos, Dursban",
    "dosage": "2ml per litre of water",
    "cost_naira": "\u20a6600-1,000 per 100ml",
    "availability": "Agro shops",
    "notes": "Do not apply within 2 weeks of harvest."
  },
  {
    "id": 8,
    "pest_id": 4,
    "method": "Cultural",
    "product_name": "Plant streak-resistant varieties",
    "product_detail": "IITA open-pollinated varieties \u2014 SUWAN 1, TZSRW",
    "dosage": "Replace susceptible varieties entirely",
    "cost_naira": "\u20a6500-800 per kg seed",
    "availability": "NASC, IITA, certified dealers",
    "notes": "Leafhopper insect spreads this virus \u2014 control vectors too"
  },
  {
    "id": 9,
    "pest_id": 4,
    "method": "Chemical",
    "product_name": "Control leafhopper vector with Imidacloprid",
    "product_detail": "Confidor, Gaucho",
    "dosage": "Seed treatment or 0.5ml/L foliar spray",
    "cost_naira": "\u20a62,000-3,000 per 100ml",
    "availability": "Agro shops",
    "notes": "Treat seeds before planting for best protection"
  },
  {
    "id": 10,
    "pest_id": 5,
    "method": "Chemical",
    "product_name": "Metalaxyl + Mancozeb",
    "product_detail": "Ridomil Gold, Mancolaxyl",
    "dosage": "2.5g per litre of water",
    "cost_naira": "\u20a61,800-3,000 per 100g",
    "availability": "Major agro shops",
    "notes": "Preventive spraying before rains. Alternate with copper fungicide."
  },
  {
    "id": 11,
    "pest_id": 5,
    "method": "Chemical",
    "product_name": "Copper Oxychloride",
    "product_detail": "Funguran, Cuprofix",
    "dosage": "3g per litre of water",
    "cost_naira": "\u20a6800-1,500 per kg",
    "availability": "Agro shops nationwide",
    "notes": "Spray every 7-10 days during humid periods"
  },
  {
    "id": 12,
    "pest_id": 6,
    "method": "Chemical",
    "product_name": "Abamectin 1.8% EC",
    "product_detail": "Dynamec, Vertimec",
    "dosage": "1ml per litre of water",
    "cost_naira": "\u20a61,200-2,000 per 100ml",
    "availability": "Major agro dealers",
    "notes": "Spray when mines first appear. Rotate chemicals to prevent resistance."
  },
  {
    "id": 13,
    "pest_id": 7,
    "method": "Chemical",
    "product_name": "Carbofuran 3% granules",
    "product_detail": "Furadan (use with care \u2014 toxic)",
    "dosage": "1kg per plot at planting",
    "cost_naira": "\u20a6600-900 per kg",
    "availability": "Agro shops",
    "notes": "Apply at planting only. Do not handle with bare hands. Very toxic."
  },
  {
    "id": 14,
    "pest_id": 7,
    "method": "Cultural",
    "product_name": "Harvest on time \u2014 do not leave in ground",
    "product_detail": "No product",
    "dosage": "Harvest when vines die back \u2014 do not delay",
    "cost_naira": "Free",
    "availability": "Anywhere",
    "notes": "Delayed harvest increases beetle damage significantly"
  },
  {
    "id": 15,
    "pest_id": 8,
    "method": "Cultural",
    "product_name": "Early planting \u2014 May to avoid peak aphid flight",
    "product_detail": "Resistant variety: Samnut 24, ICGV-IS",
    "dosage": "Plant early in season before aphid populations build",
    "cost_naira": "\u20a6600-1,000 per kg seed",
    "availability": "NASC, IITA Kano office",
    "notes": "Virus spreads by aphids \u2014 early planting avoids peak vector season"
  },
  {
    "id": 16,
    "pest_id": 9,
    "method": "Cultural",
    "product_name": "Use FARO resistant varieties",
    "product_detail": "FARO 44, FARO 52, FARO 60 \u2014 WARDA/AfricaRice varieties",
    "dosage": "Replace entire planting with resistant variety",
    "cost_naira": "\u20a6600-1,200 per kg",
    "availability": "NASC, RIFAN offices",
    "notes": "No chemical cure \u2014 resistance is only effective strategy"
  },
  {
    "id": 17,
    "pest_id": 10,
    "method": "Chemical",
    "product_name": "Imazapyr herbicide seed coating",
    "product_detail": "IR Maize / Striga-tolerant seed (Imazapyr Resistant varieties)",
    "dosage": "Use pre-treated IR maize seed \u2014 Striga dies on contact with roots",
    "cost_naira": "\u20a61,000-2,000 per kg treated seed",
    "availability": "IITA, NASC",
    "notes": "Most effective Striga control available to smallholders"
  },
  {
    "id": 18,
    "pest_id": 10,
    "method": "Cultural",
    "product_name": "Hand pull Striga before it flowers",
    "product_detail": "No product \u2014 manual labour",
    "dosage": "Pull and burn Striga plants before flowering \u2014 do not compost",
    "cost_naira": "Free \u2014 labour intensive",
    "availability": "Anywhere",
    "notes": "Must pull before seed set or you worsen next season's problem"
  },
  {
    "id": 19,
    "pest_id": 11,
    "method": "Chemical",
    "product_name": "Spinosad 45% SC",
    "product_detail": "Tracer, Entrust",
    "dosage": "0.5ml per litre",
    "cost_naira": "\u20a63,000-5,000 per 100ml",
    "availability": "Major agro dealers",
    "notes": "Very effective. Low mammalian toxicity. Spray in evenings."
  },
  {
    "id": 20,
    "pest_id": 12,
    "method": "Chemical",
    "product_name": "Pymetrozine or Imidacloprid",
    "product_detail": "Chess, Confidor",
    "dosage": "0.5ml per litre",
    "cost_naira": "\u20a61,500-2,500 per 100ml",
    "availability": "Agro shops",
    "notes": "Spray growing tips where aphids cluster"
  },
  {
    "id": 21,
    "pest_id": 12,
    "method": "Cultural",
    "product_name": "Intercrop with maize or sorghum",
    "product_detail": "No product",
    "dosage": "Plant cowpea between maize rows",
    "cost_naira": "Free",
    "availability": "Anywhere",
    "notes": "Physical barrier disrupts aphid spread"
  },
  {
    "id": 22,
    "pest_id": 13,
    "method": "Chemical",
    "product_name": "Mancozeb 80% WP",
    "product_detail": "Dithane M-45, Mancozeb",
    "dosage": "2.5g per litre, spray leaves thoroughly",
    "cost_naira": "\u20a6800-1,200 per kg",
    "availability": "Agro shops nationwide",
    "notes": "Spray every 14 days during rainy season"
  },
  {
    "id": 23,
    "pest_id": 14,
    "method": "Chemical",
    "product_name": "Metalaxyl + Mancozeb",
    "product_detail": "Ridomil Gold",
    "dosage": "2g per litre",
    "cost_naira": "\u20a61,800-3,000 per 100g",
    "availability": "Major agro shops",
    "notes": "Begin spraying preventively 3 weeks after transplanting"
  },
  {
    "id": 24,
    "pest_id": 15,
    "method": "Report to authority",
    "product_name": "Contact State Ministry of Agriculture immediately",
    "product_detail": "Government vector control \u2014 malathion ULV aerial spray",
    "dosage": "Report sighting \u2014 do not attempt individual control",
    "cost_naira": "Government handles cost",
    "availability": "State Ministry of Agriculture, FMARD hotline",
    "notes": "Individual farmers cannot control locusts. Collective early reporting is the only action."
  }
];

export const FERTILIZERS: Fertilizer[] = [
  {
    "id": 1,
    "crop_id": 1,
    "fertilizer_name": "NPK 12-12-17",
    "npk_ratio": "12-12-17",
    "application_stage": "Basal application",
    "kg_per_hectare": "400",
    "cost_naira_per_bag": "\u20a622,000-25,000",
    "timing_weeks": "4-6"
  },
  {
    "id": 2,
    "crop_id": 1,
    "fertilizer_name": "Urea",
    "npk_ratio": "46-0-0",
    "application_stage": "Top dressing",
    "kg_per_hectare": "150",
    "cost_naira_per_bag": "\u20a618,000-22,000",
    "timing_weeks": "8-10"
  },
  {
    "id": 3,
    "crop_id": 2,
    "fertilizer_name": "NPK 15-15-15",
    "npk_ratio": "15-15-15",
    "application_stage": "Basal \u2014 at planting",
    "kg_per_hectare": "250",
    "cost_naira_per_bag": "\u20a622,000-26,000",
    "timing_weeks": "1-2"
  },
  {
    "id": 4,
    "crop_id": 2,
    "fertilizer_name": "Urea",
    "npk_ratio": "46-0-0",
    "application_stage": "Top dressing",
    "kg_per_hectare": "150",
    "cost_naira_per_bag": "\u20a618,000-22,000",
    "timing_weeks": "4-5"
  },
  {
    "id": 5,
    "crop_id": 2,
    "fertilizer_name": "Urea",
    "npk_ratio": "46-0-0",
    "application_stage": "Second top dressing",
    "kg_per_hectare": "100",
    "cost_naira_per_bag": "\u20a618,000-22,000",
    "timing_weeks": "7-8"
  },
  {
    "id": 6,
    "crop_id": 3,
    "fertilizer_name": "NPK 15-15-15",
    "npk_ratio": "15-15-15",
    "application_stage": "Basal",
    "kg_per_hectare": "300",
    "cost_naira_per_bag": "\u20a622,000-26,000",
    "timing_weeks": "4"
  },
  {
    "id": 7,
    "crop_id": 3,
    "fertilizer_name": "Sulphate of Ammonia",
    "npk_ratio": "21-0-0",
    "application_stage": "Top dressing",
    "kg_per_hectare": "200",
    "cost_naira_per_bag": "\u20a614,000-18,000",
    "timing_weeks": "10"
  },
  {
    "id": 8,
    "crop_id": 4,
    "fertilizer_name": "NPK 15-15-15",
    "npk_ratio": "15-15-15",
    "application_stage": "At transplanting",
    "kg_per_hectare": "200",
    "cost_naira_per_bag": "\u20a622,000-26,000",
    "timing_weeks": "1"
  },
  {
    "id": 9,
    "crop_id": 4,
    "fertilizer_name": "CAN (Calcium Ammonium Nitrate)",
    "npk_ratio": "26-0-0",
    "application_stage": "Top dressing",
    "kg_per_hectare": "150",
    "cost_naira_per_bag": "\u20a616,000-20,000",
    "timing_weeks": "4"
  },
  {
    "id": 10,
    "crop_id": 4,
    "fertilizer_name": "NPK 20-10-10",
    "npk_ratio": "20-10-10",
    "application_stage": "Fruiting stage",
    "kg_per_hectare": "100",
    "cost_naira_per_bag": "\u20a624,000-28,000",
    "timing_weeks": "7"
  },
  {
    "id": 11,
    "crop_id": 5,
    "fertilizer_name": "NPK 15-15-15",
    "npk_ratio": "15-15-15",
    "application_stage": "Basal",
    "kg_per_hectare": "200",
    "cost_naira_per_bag": "\u20a622,000-26,000",
    "timing_weeks": "2"
  },
  {
    "id": 12,
    "crop_id": 5,
    "fertilizer_name": "Urea",
    "npk_ratio": "46-0-0",
    "application_stage": "Top dressing",
    "kg_per_hectare": "100",
    "cost_naira_per_bag": "\u20a618,000-22,000",
    "timing_weeks": "5"
  },
  {
    "id": 13,
    "crop_id": 8,
    "fertilizer_name": "NPK 15-15-15",
    "npk_ratio": "15-15-15",
    "application_stage": "Basal at transplanting",
    "kg_per_hectare": "300",
    "cost_naira_per_bag": "\u20a622,000-26,000",
    "timing_weeks": "1"
  },
  {
    "id": 14,
    "crop_id": 8,
    "fertilizer_name": "Urea",
    "npk_ratio": "46-0-0",
    "application_stage": "Tillering stage",
    "kg_per_hectare": "150",
    "cost_naira_per_bag": "\u20a618,000-22,000",
    "timing_weeks": "5"
  },
  {
    "id": 15,
    "crop_id": 8,
    "fertilizer_name": "Urea",
    "npk_ratio": "46-0-0",
    "application_stage": "Panicle initiation",
    "kg_per_hectare": "100",
    "cost_naira_per_bag": "\u20a618,000-22,000",
    "timing_weeks": "9"
  },
  {
    "id": 16,
    "crop_id": 15,
    "fertilizer_name": "NPK 15-15-15",
    "npk_ratio": "15-15-15",
    "application_stage": "Basal",
    "kg_per_hectare": "300",
    "cost_naira_per_bag": "\u20a622,000-26,000",
    "timing_weeks": "1-2"
  },
  {
    "id": 17,
    "crop_id": 15,
    "fertilizer_name": "Urea",
    "npk_ratio": "46-0-0",
    "application_stage": "Top dressing",
    "kg_per_hectare": "150",
    "cost_naira_per_bag": "\u20a618,000-22,000",
    "timing_weeks": "4"
  },
  {
    "id": 18,
    "crop_id": 15,
    "fertilizer_name": "Muriate of Potash",
    "npk_ratio": "0-0-60",
    "application_stage": "Bulb development",
    "kg_per_hectare": "100",
    "cost_naira_per_bag": "\u20a620,000-24,000",
    "timing_weeks": "7"
  }
];

export const MARKET_PRICES: MarketPrice[] = [
  {
    "id": 1,
    "crop_id": 1,
    "region": "Lagos",
    "price_per_kg_naira": 85.0,
    "price_per_bag_naira": 4250.0,
    "market_name": "Mile 12 Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 2,
    "crop_id": 1,
    "region": "Onitsha",
    "price_per_kg_naira": 70.0,
    "price_per_bag_naira": 3500.0,
    "market_name": "Ose Market",
    "last_updated": "2024-11",
    "trend": "Stable"
  },
  {
    "id": 3,
    "crop_id": 1,
    "region": "Ibadan",
    "price_per_kg_naira": 75.0,
    "price_per_bag_naira": 3750.0,
    "market_name": "Bodija Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 4,
    "crop_id": 2,
    "region": "Kano",
    "price_per_kg_naira": 280.0,
    "price_per_bag_naira": 14000.0,
    "market_name": "Dawanau Grain Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 5,
    "crop_id": 2,
    "region": "Lagos",
    "price_per_kg_naira": 320.0,
    "price_per_bag_naira": 16000.0,
    "market_name": "Mile 12 Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 6,
    "crop_id": 2,
    "region": "Onitsha",
    "price_per_kg_naira": 300.0,
    "price_per_bag_naira": 15000.0,
    "market_name": "Ose Market",
    "last_updated": "2024-11",
    "trend": "Stable"
  },
  {
    "id": 7,
    "crop_id": 3,
    "region": "Lagos",
    "price_per_kg_naira": 500.0,
    "price_per_bag_naira": 25000.0,
    "market_name": "Mile 12 Market",
    "last_updated": "2024-11",
    "trend": "Stable"
  },
  {
    "id": 8,
    "crop_id": 3,
    "region": "Onitsha",
    "price_per_kg_naira": 420.0,
    "price_per_bag_naira": 21000.0,
    "market_name": "Ose Market",
    "last_updated": "2024-11",
    "trend": "Falling"
  },
  {
    "id": 9,
    "crop_id": 3,
    "region": "Abuja",
    "price_per_kg_naira": 550.0,
    "price_per_bag_naira": 27500.0,
    "market_name": "Wuse Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 10,
    "crop_id": 4,
    "region": "Kano",
    "price_per_kg_naira": 350.0,
    "price_per_bag_naira": 8750.0,
    "market_name": "Rimi Market",
    "last_updated": "2024-11",
    "trend": "Falling"
  },
  {
    "id": 11,
    "crop_id": 4,
    "region": "Lagos",
    "price_per_kg_naira": 600.0,
    "price_per_bag_naira": 15000.0,
    "market_name": "Mile 12 Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 12,
    "crop_id": 4,
    "region": "Ibadan",
    "price_per_kg_naira": 400.0,
    "price_per_bag_naira": 10000.0,
    "market_name": "Bodija Market",
    "last_updated": "2024-11",
    "trend": "Stable"
  },
  {
    "id": 13,
    "crop_id": 8,
    "region": "Kebbi",
    "price_per_kg_naira": 550.0,
    "price_per_bag_naira": 27500.0,
    "market_name": "Argungu Market",
    "last_updated": "2024-11",
    "trend": "Stable"
  },
  {
    "id": 14,
    "crop_id": 8,
    "region": "Lagos",
    "price_per_kg_naira": 750.0,
    "price_per_bag_naira": 37500.0,
    "market_name": "Mile 12 Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 15,
    "crop_id": 8,
    "region": "Abuja",
    "price_per_kg_naira": 700.0,
    "price_per_bag_naira": 35000.0,
    "market_name": "Wuse Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 16,
    "crop_id": 6,
    "region": "Kano",
    "price_per_kg_naira": 700.0,
    "price_per_bag_naira": 35000.0,
    "market_name": "Dawanau Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 17,
    "crop_id": 6,
    "region": "Abuja",
    "price_per_kg_naira": 800.0,
    "price_per_bag_naira": 40000.0,
    "market_name": "Wuse Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 18,
    "crop_id": 15,
    "region": "Sokoto",
    "price_per_kg_naira": 400.0,
    "price_per_bag_naira": 20000.0,
    "market_name": "Sokoto Market",
    "last_updated": "2024-11",
    "trend": "Falling"
  },
  {
    "id": 19,
    "crop_id": 15,
    "region": "Lagos",
    "price_per_kg_naira": 700.0,
    "price_per_bag_naira": 35000.0,
    "market_name": "Mile 12 Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 20,
    "crop_id": 15,
    "region": "Kano",
    "price_per_kg_naira": 450.0,
    "price_per_bag_naira": 22500.0,
    "market_name": "Rimi Market",
    "last_updated": "2024-11",
    "trend": "Stable"
  },
  {
    "id": 21,
    "crop_id": 20,
    "region": "Kaduna",
    "price_per_kg_naira": 900.0,
    "price_per_bag_naira": 45000.0,
    "market_name": "Kaduna Central Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  },
  {
    "id": 22,
    "crop_id": 20,
    "region": "Lagos",
    "price_per_kg_naira": 1200.0,
    "price_per_bag_naira": 60000.0,
    "market_name": "Mile 12 Market",
    "last_updated": "2024-11",
    "trend": "Rising"
  }
];

export function findCropContext(query: string): string {
  const q = query.toLowerCase();
  const matchedCrop = CROPS.find(c => 
    c.name.toLowerCase().includes(q) || 
    q.includes(c.name.toLowerCase()) || 
    (c.local_names && c.local_names.toLowerCase().split(',').some(ln => q.includes(ln.trim().toLowerCase())))
  );

  if (!matchedCrop) return '';

  const cropPests = PESTS.filter(p => (p.affected_crops || '').toLowerCase().includes(matchedCrop.name.toLowerCase()));
  const cropFertilizers = FERTILIZERS.filter(f => f.crop_id === matchedCrop.id);
  const cropPrices = MARKET_PRICES.filter(m => m.crop_id === matchedCrop.id);

  let context = `[Crop Knowledge: ${matchedCrop.name} (${matchedCrop.local_names || ''})]\n`;
  context += `Zones: ${matchedCrop.growing_zones || 'All zones'} | Plant: ${matchedCrop.planting_months || 'Seasonal'} | Harvest: ${matchedCrop.harvest_months || 'Seasonal'}\n`;
  context += `Soil: ${matchedCrop.soil_type || 'Well-drained'} | Water: ${matchedCrop.water_needs || 'Moderate'} | Yield: ${matchedCrop.yield_per_hectare || 'Standard'}\n`;

  if (cropPrices.length > 0) {
    context += `Regional Market Prices: ` + cropPrices.map(p => `${p.region} (${p.market_name}): ₦${p.price_per_kg_naira}/kg (₦${p.price_per_bag_naira}/bag, ${p.trend})`).join('; ') + '\n';
  }

  if (cropFertilizers.length > 0) {
    context += `Fertilizer Schedule: ` + cropFertilizers.map(f => `${f.fertilizer_name} (${f.npk_ratio}) at ${f.application_stage}: ${f.kg_per_hectare} kg/ha, ${f.timing_weeks}, ₦${f.cost_naira_per_bag}/bag`).join('; ') + '\n';
  }

  if (cropPests.length > 0) {
    context += `Known Pests/Diseases:\n`;
    for (const p of cropPests) {
      const pestTreatments = TREATMENTS.filter(t => t.pest_id === p.id);
      const treatStr = pestTreatments.map(t => `${t.product_name} (${t.dosage}, ~₦${t.cost_naira})`).join(', ');
      context += `- ${p.name}: Symptoms: ${p.symptoms || ''}. Treatments: ${treatStr || 'N/A'}\n`;
    }
  }

  return context;
}

export function findPestOrTreatment(query: string): string {
  const q = query.toLowerCase();
  const matchedPests = PESTS.filter(p => 
    p.name.toLowerCase().includes(q) || 
    (p.symptoms && p.symptoms.toLowerCase().includes(q)) ||
    q.includes(p.name.toLowerCase())
  );

  if (matchedPests.length === 0) return '';

  let context = '[Pest & Treatment Matches]\n';
  for (const pest of matchedPests) {
    const treatments = TREATMENTS.filter(t => t.pest_id === pest.id);
    const treatInfo = treatments.map(t => `${t.method} with ${t.product_name} (dosage: ${t.dosage}, est. cost: ₦${t.cost_naira}, ${t.availability})`).join('; ');
    context += `• ${pest.name} (Affects: ${pest.affected_crops}): ${pest.symptoms}. Recommended treatments: ${treatInfo}\n`;
  }
  return context;
}
