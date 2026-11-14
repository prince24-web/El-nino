import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

PDF_PATH = r"C:\Users\hp\Desktop\el-nino\EL_NINO_TEAM_8_PROJECT_OVERVIEW.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#5C6359"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "EL-NINO — Autonomous Agricultural Intelligence & IoT Farm Guardian")
            self.drawRightString(558, 750, "Buildathon Group 8 | Project Overview")
            self.setStrokeColor(colors.HexColor("#D2D0C3"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#D2D0C3"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "Confidential — Prepared for Hackathon Evaluation • El Nino Team 8")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()

def create_project_overview():
    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#16512E")   # Forest Green
    secondary_color = colors.HexColor("#2D6A4F") # Dark Leaf Green
    accent_color = colors.HexColor("#B7791F")    # Warm Gold/Amber
    dark_text = colors.HexColor("#1A1F1B")
    body_text = colors.HexColor("#374151")
    light_bg = colors.HexColor("#F4F6F4")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=secondary_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=body_text,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=body_text,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E3A24"),
        spaceAfter=4
    )

    story = []

    # Title & Metadata Banner
    story.append(Paragraph("🌿 EL-NINO: Autonomous Agricultural Intelligence & IoT Farm Guardian", title_style))
    story.append(Paragraph("<b>A Cyber-Physical System Uniting Google Gemini 3.1 Flash AI, Edge IoT Telemetry, and 3D Farmland Digital Twin Simulation</b>", subtitle_style))
    
    meta_data = [
        [
            Paragraph("<b>Team:</b> El Nino Team 8 (Buildathon Group 8)", body_style),
            Paragraph("<b>Category:</b> AI & Climate-Smart Agriculture / IoT", body_style)
        ],
        [
            Paragraph("<b>Target Region:</b> Nigeria & Sub-Saharan Africa", body_style),
            Paragraph("<b>Deployment:</b> Cloud Next.js 16 (Vercel) + ESP32 Edge Sensor", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#C5DECB")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 1. Executive Summary
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(
        "Smallholder farmers across Sub-Saharan Africa produce over <b>80% of domestic food supplies</b>, yet routinely suffer annual crop losses of 30% to 50%. These losses are driven by climate volatility (the El Niño cycle of drought followed by flash floods), untamed fungal/bacterial blights, wildfires during dry Harmattan spells, and severe agricultural extension shortages (>1:3,000 farmer-to-expert deficit).",
        body_style
    ))
    story.append(Paragraph(
        "<b>El-Nino</b> is a complete cyber-physical platform engineered to eliminate these bottlenecks. Combining an affordable <b>ESP32 IoT sensor node</b> (soil moisture, rainfall, wildfire detection), a <b>real-time 3D Digital Twin simulation</b> of the farmland, and <b>Google Gemini 3.1 Flash multimodal AI</b>, El-Nino empowers farmers with proactive hazard alerts, instant leaf disease diagnosis from smartphone photos, and local Naira (₦) market intelligence.",
        body_style
    ))

    # 2. Problem Statement Alignment (Buildathon Group 8 Matrix)
    story.append(Paragraph("2. Buildathon Group 8 Problem Statement Alignment", h1_style))
    story.append(Paragraph(
        "The project directly addresses all four primary problem statements identified by Buildathon Group 8, plus the critical hazard of seasonal wildfire:",
        body_style
    ))

    prob_matrix = [
        [
            Paragraph("<b>Buildathon Problem Statement</b>", body_style),
            Paragraph("<b>Severity</b>", body_style),
            Paragraph("<b>How El-Nino Solves It</b>", body_style)
        ],
        [
            Paragraph("<b>1. Poor Access to Market Information:</b> Farmers struggle to find timely commodity prices, leading to exploitative middlemen sales.", body_style),
            Paragraph("<font color='#B7791F'><b>High</b></font>", body_style),
            Paragraph("<b>Grounded Market Engine:</b> Real-time tracked Naira (₦/kg and ₦/bag) prices for 20 crops across Mile 12 (Lagos), Bodija (Ibadan), and Dawanau (Kano).", body_style)
        ],
        [
            Paragraph("<b>2. Crop Pests & Diseases:</b> Farmers identify blights too late; lack expert guidance on pest eradication.", body_style),
            Paragraph("<font color='#C53030'><b>Critical</b></font>", body_style),
            Paragraph("<b>Gemini 3.1 Flash Multimodal Vision:</b> Instant leaf photo analysis mapping lesions against PlantVillage taxonomy with knapsack dosage recipes in Naira (₦).", body_style)
        ],
        [
            Paragraph("<b>3. Unpredictable Weather & Soil Water:</b> Irregular rain, drought spells, and waterlogging/flooding cause crop death.", body_style),
            Paragraph("<font color='#C53030'><b>Critical</b></font>", body_style),
            Paragraph("<b>IoT Rain & Soil Probe + 3D Simulation:</b> ESP32 monitors soil saturation. 3D app simulates rain and floodwater rise, triggering emergency drainage AI plans.", body_style)
        ],
        [
            Paragraph("<b>4. Limited Agricultural Knowledge & Extension:</b> >1:3,000 officer deficit leaves farmers without soil or crop management support.", body_style),
            Paragraph("<font color='#B7791F'><b>High</b></font>", body_style),
            Paragraph("<b>24/7 AI Agronomy Specialist:</b> Tailored guidance on 20 crops, NPK/Urea schedules, and soil care in English, Nigerian Pidgin, Yoruba, Hausa, and Igbo.", body_style)
        ],
        [
            Paragraph("<b>BONUS: Wildfire & Bush Burning Outbreak:</b> Harmattan dry-season fires destroy acres of farmland, barns, and standing crops.", body_style),
            Paragraph("<font color='#C53030'><b>Critical</b></font>", body_style),
            Paragraph("<b>Flame & Heat Sensor Node:</b> Immediate optical flame detection triggers high-decibel buzzers, mobile push alarms, and AI emergency firebreak advice.", body_style)
        ]
    ]

    prob_table = Table(prob_matrix, colWidths=[170, 54, 280])
    prob_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E6F0E8")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D2D0C3")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
    ]))
    story.append(prob_table)
    story.append(Spacer(1, 10))

    # Page Break for clean reading
    story.append(PageBreak())

    # 3. Cyber-Physical Hardware Architecture
    story.append(Paragraph("3. Cyber-Physical Hardware & Sensor Architecture", h1_style))
    story.append(Paragraph(
        "El-Nino couples high-speed cloud intelligence with rugged, low-cost edge IoT hardware designed to withstand farm conditions:",
        body_style
    ))

    hw_specs = [
        [Paragraph("<b>Hardware Component</b>", body_style), Paragraph("<b>Model / Specs</b>", body_style), Paragraph("<b>Functional Responsibility in Farmland</b>", body_style)],
        [
            Paragraph("<b>Microcontroller Node</b>", body_style),
            Paragraph("ESP32-WROOM-32 (Dual-core 240MHz, Wi-Fi/BLE)", body_style),
            Paragraph("Gathers analog and digital telemetry; runs local threshold evaluation; transmits encrypted telemetry packets over HTTP/MQTT to Vercel Next.js edge API.", body_style)
        ],
        [
            Paragraph("<b>Soil Moisture Sensor</b>", body_style),
            Paragraph("Capacitive Soil Probe v1.2 (Corrosion-resistant)", body_style),
            Paragraph("Measures soil dielectric permittivity (GPIO 34 ADC). Detects soil drought (<30%), optimal root zone moisture (40-75%), and dangerous waterlogging (>85%).", body_style)
        ],
        [
            Paragraph("<b>Raindrop Impact Sensor</b>", body_style),
            Paragraph("FC-37 Rain Board + LM393 Comparator", body_style),
            Paragraph("Detects surface raindrop precipitation (GPIO 35 ADC). Distinguishes light drizzle from severe downpours that cause surface flash flooding.", body_style)
        ],
        [
            Paragraph("<b>Wildfire / Flame Sensor</b>", body_style),
            Paragraph("YG1006 Infrared Flame Sensor (760nm–1100nm)", body_style),
            Paragraph("Monitors ambient thermal/IR emissions with 60° detection angle (GPIO 32 ADC/D0). Detects dry-season bushfires, trash burning, or equipment fires.", body_style)
        ],
        [
            Paragraph("<b>Alert Actuator & Power</b>", body_style),
            Paragraph("Active 85dB Buzzer + 5V Solar Powerbank / Li-Ion", body_style),
            Paragraph("Provides immediate localized on-field audible warning when fire or flash flooding is detected, backed by independent solar-rechargeable power.", body_style)
        ]
    ]

    hw_table = Table(hw_specs, colWidths=[110, 140, 254])
    hw_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E6F0E8")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D2D0C3")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
    ]))
    story.append(hw_table)
    story.append(Spacer(1, 10))

    # 4. 3D Digital Twin Simulation Engine
    story.append(Paragraph("4. The 3D Farmland Digital Twin Simulation", h1_style))
    story.append(Paragraph(
        "A standout feature of El-Nino is its interactive WebGL/Three.js 3D simulation embedded directly inside the Next.js app. The 3D plot mirrors what the ESP32 sensors detect in real time:",
        body_style
    ))
    story.append(Paragraph("• <b>Dynamic Rain Particle Engine:</b> When raindrops touch the physical rain sensor, the 3D sky shifts from sunny to overcast, and thousands of animated 3D rain particles streak down with splash ripple geometry on the soil.", bullet_style))
    story.append(Paragraph("• <b>Soil Moisture State Shifts:</b> The 3D soil terrain transitions dynamically between three states: Parched/Cracked pale brown (0-30%), Rich Dark Loam (40-75%), and Waterlogged (80%+).", bullet_style))
    story.append(Paragraph("• <b>Rising Floodwater Plane:</b> As soil moisture exceeds 80%, a translucent, reflective blue flood plane visibly rises above the soil surface, submerging plant roots to clearly depict root rot and asphyxiation risk.", bullet_style))
    story.append(Paragraph("• <b>Wildfire Heat Flare Simulation:</b> When flame is detected, a pulsing red thermal perimeter glow surrounds the 3D plot, activating an audio alert and flashing hazard badge.", bullet_style))

    # 5. Multimodal AI & Grounded Knowledge
    story.append(Paragraph("5. AI Brain: Multimodal Vision & Grounded Agronomy", h1_style))
    story.append(Paragraph(
        "Rather than relying on generic AI, El-Nino implements strict domain grounding tailored for Nigerian smallholders:",
        body_style
    ))
    story.append(Paragraph("• <b>Plant Pathology Diagnostic Vision:</b> Farmers snap a leaf photo. Gemini 3.1 Flash inspects lesion morphology (e.g. concentric target rings in Tomato Early Blight, water-soaked brown rot in Late Blight, pustules in Maize Rust). It outputs structured diagnostic headers with severity ratings.", bullet_style))
    story.append(Paragraph("• <b>Local Input Pricing in Naira (₦):</b> Prescribes exact chemical and organic recipes (Mancozeb, Ridomil Gold, Cypermethrin, neem oil extract) with dilution rates per standard 15L/16L knapsack sprayer and local cost estimates.", bullet_style))
    story.append(Paragraph("• <b>Grounded Crop Knowledge Base:</b> Full profiles for 20 staple crops (Cassava, Maize, Yam, Groundnut, Tomato, etc.) detailing growing zones, planting/harvesting calendars, NPK/Urea split application timings, and soil types.", bullet_style))

    # Page Break for Demo & Impact
    story.append(PageBreak())

    # 6. Live Hackathon Demonstration Walkthrough
    story.append(Paragraph("6. Step-by-Step Live Hackathon Demo Script", h1_style))
    story.append(Paragraph(
        "To maximize judging score and demonstrate true cyber-physical innovation, Team 8 can execute this dramatic 3-minute stage demo:",
        body_style
    ))

    demo_steps = [
        [Paragraph("<b>Demo Step</b>", body_style), Paragraph("<b>Physical Action (Stage)</b>", body_style), Paragraph("<b>App & 3D Simulation Response (Screen)</b>", body_style)],
        [
            Paragraph("<b>Step 1: Baseline State</b>", body_style),
            Paragraph("Show physical soil pot with ESP32 probe inserted. Normal dry/moist soil.", body_style),
            Paragraph("App displays green status dot: 'Gemini Online • Soil Moisture 45% (Optimal) • Clear Sky'. 3D farmland shows healthy maize stalks in rich loam.", body_style)
        ],
        [
            Paragraph("<b>Step 2: Flood & Rain Simulation</b>", body_style),
            Paragraph("Pour water from a water bottle over the soil and onto the rain sensor plate.", body_style),
            Paragraph("<b>INSTANT REACTION:</b> 3D simulation triggers falling rain particles and storm clouds. Soil moisture metric shoots to 92%. A reflective floodwater plane rises above the soil. App triggers <b>'⚠️ FLOOD HAZARD DETECTED'</b> alert.", body_style)
        ],
        [
            Paragraph("<b>Step 3: AI Emergency Action</b>", body_style),
            Paragraph("Tap the one-click 'Ask El-Nino for Emergency Drainage Plan' button on the alert.", body_style),
            Paragraph("Gemini streams immediate emergency advice: digging lateral furrows, draining waterlogged beds, and spraying copper fungicide to stop post-flood rot.", body_style)
        ],
        [
            Paragraph("<b>Step 4: Wildfire / Flame Test</b>", body_style),
            Paragraph("Flick a lighter safely 10-15cm away from the flame sensor.", body_style),
            Paragraph("<b>INSTANT ALARM:</b> ESP32 on-board buzzer sounds. 3D simulation pulses red. App flashes <b>'🔥 WILDFIRE OUTBREAK DETECTED'</b> with immediate emergency firebreak advice.", body_style)
        ],
        [
            Paragraph("<b>Step 5: Plant Pathology Scan</b>", body_style),
            Paragraph("Upload photo of a diseased tomato leaf with late blight lesions.", body_style),
            Paragraph("Gemini visual scanner outputs: <b>[Tomato Late Blight • High Severity]</b>, knapsack spraying recipe (Ridomil Gold MZ), dosage, and estimated cost in Naira (₦3,500-4,500).", body_style)
        ]
    ]

    demo_table = Table(demo_steps, colWidths=[100, 160, 244])
    demo_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E6F0E8")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D2D0C3")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_bg]),
    ]))
    story.append(demo_table)
    story.append(Spacer(1, 10))

    # 7. Impact, SDGs & Business Model
    story.append(Paragraph("7. Social Impact, Sustainable Development Goals & Roadmap", h1_style))
    story.append(Paragraph(
        "El-Nino is aligned with the United Nations Sustainable Development Goals (SDGs):",
        body_style
    ))
    story.append(Paragraph("• <b>SDG 2 (Zero Hunger):</b> Mitigates up to 35% of post-planting crop loss from early blight detection, flood drainage, and fire prevention.", bullet_style))
    story.append(Paragraph("• <b>SDG 1 (No Poverty) & SDG 8:</b> Enhances farmer profit margins by eliminating commodity price asymmetry and preventing fraudulent middleman pricing.", bullet_style))
    story.append(Paragraph("• <b>SDG 13 (Climate Action):</b> Delivers proactive adaptation tools against erratic weather, El Niño deluges, and prolonged dry spells.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Business & Scaling Model:</b>", h2_style))
    story.append(Paragraph("1. <b>B2C Freemium Mobile App:</b> Free conversational advisory, crop calendars, and market price checking; premium pathology scans for large-scale cooperatives.", body_style))
    story.append(Paragraph("2. <b>Hardware-as-a-Service (HaaS):</b> Low-cost ESP32 Farm Guardian kits sold at cost (₦12,000–₦15,000) or subsidized via agricultural development programs (ADPs) and NGOs.", body_style))
    story.append(Paragraph("3. <b>B2G & Agro-Enterprise Dashboard:</b> Anonymized regional disease prevalence heatmaps and market price tracking sold to ministries of agriculture, crop insurers, and input manufacturers.", body_style))

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D2D0C3"), spaceBefore=10, spaceAfter=10))
    story.append(Paragraph("<b>Buildathon Team 8:</b> Dedicated to transforming smallholder resilience through cutting-edge cyber-physical AI. Built for impact.", callout_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at: {PDF_PATH}")

if __name__ == "__main__":
    create_project_overview()
