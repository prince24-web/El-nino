// PlantVillage 38-class taxonomy & Nigerian agricultural translation

export interface DiseaseInfo {
  displayName: string;
  crop: string;
  severity: "None" | "Low" | "Medium" | "High" | "Very High" | "Unknown";
  localTip: string;
  recommendedTreatment?: string;
}

export const PLANT_DISEASE_KNOWLEDGE: Record<string, DiseaseInfo> = {
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
    displayName: "Maize Gray Leaf Spot",
    crop: "Maize (Agbado / Masara)",
    severity: "Medium",
    localTip: "Common in humid southern zones. Improves during dry weather.",
    recommendedTreatment: "Apply Mancozeb 80% WP (30g per 15L knapsack) at first sign of gray lesions.",
  },
  "Corn_(maize)___Common_rust": {
    displayName: "Maize Common Rust",
    crop: "Maize (Agbado / Masara)",
    severity: "Medium",
    localTip: "Orange-brown pustules on upper leaves. Worse during cool, moist periods.",
    recommendedTreatment: "Foliar spray with Azoxystrobin or Mancozeb; ensure proper plant spacing for aeration.",
  },
  "Corn_(maize)___Northern_Leaf_Blight": {
    displayName: "Maize Northern Leaf Blight",
    crop: "Maize (Agbado / Masara)",
    severity: "High",
    localTip: "Long gray-green elliptical lesions. Major yield danger if untreated before tasseling.",
    recommendedTreatment: "Spray Ridomil Gold or Mancozeb early; rotate crops with cowpea or soybean next season.",
  },
  "Corn_(maize)___healthy": {
    displayName: "Healthy Maize",
    crop: "Maize (Agbado / Masara)",
    severity: "None",
    localTip: "Plant foliage looks vigorous and clean. Continue regular weed and fertilizer management.",
  },
  "Tomato___Bacterial_spot": {
    displayName: "Tomato Bacterial Spot",
    crop: "Tomato (Tomati)",
    severity: "High",
    localTip: "Water-soaked dark spots on leaves and fruit. Spreads rapidly with rain splash and overhead watering.",
    recommendedTreatment: "Copper hydroxide or Copper Oxychloride spray (50g per 15L water). Avoid overhead irrigation.",
  },
  "Tomato___Early_blight": {
    displayName: "Tomato Early Blight",
    crop: "Tomato (Tomati)",
    severity: "Medium",
    localTip: "Brown spots with concentric rings (target pattern) on older leaves, yellow halo.",
    recommendedTreatment: "Spray Mancozeb (Dithane M-45) at 40g/15L every 7-10 days. Remove lower leaves touching soil.",
  },
  "Tomato___Late_blight": {
    displayName: "Tomato Late Blight",
    crop: "Tomato (Tomati)",
    severity: "Very High",
    localTip: "Most destructive tomato disease in wet weather. Dark water-soaked lesions turn brown, white mold underneath.",
    recommendedTreatment: "Urgent: Spray Ridomil Gold (Mefenoxam + Mancozeb) immediately (50g per 15L knapsack, ~₦3,500-4,500/sachet).",
  },
  "Tomato___Leaf_Mold": {
    displayName: "Tomato Leaf Mold",
    crop: "Tomato (Tomati)",
    severity: "Medium",
    localTip: "Pale greenish-yellow patches on upper leaf surface, olive-green velvety mold underneath.",
    recommendedTreatment: "Improve field spacing and pruning to maximize airflow. Apply copper fungicide if spreading.",
  },
  "Tomato___Septoria_leaf_spot": {
    displayName: "Tomato Septoria Leaf Spot",
    crop: "Tomato (Tomati)",
    severity: "Medium",
    localTip: "Small circular spots with dark borders and pale centers on lower foliage.",
    recommendedTreatment: "Prune affected bottom leaves; apply Chlorothalonil or Mancozeb.",
  },
  "Tomato___Spider_mites Two-spotted_spider_mite": {
    displayName: "Tomato Spider Mites",
    crop: "Tomato (Tomati)",
    severity: "Medium",
    localTip: "Fine yellow speckling on leaf surfaces, delicate webbing on undersides. Worse in dry, hot spells.",
    recommendedTreatment: "Spray Abamectin (10ml per 15L water) or neem oil extract on leaf undersides.",
  },
  "Tomato___Target_Spot": {
    displayName: "Tomato Target Spot",
    crop: "Tomato (Tomati)",
    severity: "Medium",
    localTip: "Circular brown lesions with distinct concentric target rings.",
    recommendedTreatment: "Apply Mancozeb or Azoxystrobin; mulch soil to stop spore splash.",
  },
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
    displayName: "Tomato Yellow Leaf Curl Virus (TYLCV)",
    crop: "Tomato (Tomati)",
    severity: "Very High",
    localTip: "Leaves cup upwards, turn bright yellow, and plant becomes severely stunted. Vectored by whiteflies.",
    recommendedTreatment: "No cure for infected plants: uproot and destroy infected plants. Spray Cypermethrin + Dimethoate to control whitefly vectors.",
  },
  "Tomato___Tomato_mosaic_virus": {
    displayName: "Tomato Mosaic Virus",
    crop: "Tomato (Tomati)",
    severity: "High",
    localTip: "Mottled light and dark green mosaic pattern on leaves, fern-like distortion.",
    recommendedTreatment: "Uproot infected plants immediately; wash hands/tools before touching healthy plants.",
  },
  "Tomato___healthy": {
    displayName: "Healthy Tomato",
    crop: "Tomato (Tomati)",
    severity: "None",
    localTip: "Vigorous foliage with no signs of fungal or bacterial lesions.",
  },
  "Pepper,_bell___Bacterial_spot": {
    displayName: "Pepper Bacterial Spot",
    crop: "Pepper (Ose / Tatashe / Rodo)",
    severity: "High",
    localTip: "Small, water-soaked, dark brown blistering spots on leaves and fruits.",
    recommendedTreatment: "Spray Copper Oxychloride; avoid handling wet plants.",
  },
  "Pepper,_bell___healthy": {
    displayName: "Healthy Pepper",
    crop: "Pepper (Ose / Tatashe / Rodo)",
    severity: "None",
    localTip: "Clean foliage, good flowering and fruit development.",
  },
  "Potato___Early_blight": {
    displayName: "Early Blight (Irish Potato / Tomato)",
    crop: "Irish Potato (Dankali) / Tomato",
    severity: "Medium",
    localTip: "Concentric target spots on older foliage.",
    recommendedTreatment: "Mancozeb 80% WP foliar spray.",
  },
  "Potato___Late_blight": {
    displayName: "Late Blight (Irish Potato)",
    crop: "Irish Potato (Dankali) / Tomato",
    severity: "Very High",
    localTip: "Devastating in Jos Plateau and rainy highlands. Destroys foliage in days.",
    recommendedTreatment: "Immediate systemic spray with Ridomil Gold MZ or Metalaxyl.",
  },
  "Potato___healthy": {
    displayName: "Healthy Potato",
    crop: "Irish Potato (Dankali)",
    severity: "None",
    localTip: "Vigorous stems and green foliage.",
  },
  "Cassava___Mosaic_Disease": {
    displayName: "Cassava Mosaic Disease (CMD)",
    crop: "Cassava (Akpu / Ege / Rogo)",
    severity: "High",
    localTip: "Distorted leaves with yellow and green mosaic pattern. Stunted tuber size.",
    recommendedTreatment: "Plant resistant varieties (TME 419, TMS 98/0505 from IITA/NRCRI); rogue out and burn infected plants early.",
  },
  "Squash___Powdery_mildew": {
    displayName: "Powdery Mildew (Pumpkin / Squash / Ugwu)",
    crop: "Pumpkin / Ugwu / Squash",
    severity: "Medium",
    localTip: "White powdery talcum-like coating on leaves.",
    recommendedTreatment: "Spray sulfur-based fungicide or potassium bicarbonate solution (5g/L).",
  },
  "Orange___Haunglongbing_(Citrus_greening)": {
    displayName: "Citrus Greening (HLB)",
    crop: "Orange / Citrus",
    severity: "Very High",
    localTip: "Yellow shoot disease, asymmetric blotchy mottle on leaves.",
    recommendedTreatment: "Control citrus psyllid insects with systemic insecticides; prune infected branches.",
  },
};
