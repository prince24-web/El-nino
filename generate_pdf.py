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
            Paragraph("<b>Deployment:</b> nino-three.vercel.app + Supabase + Wireless ESP-32D", body_style)
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
        "<b>El-Nino</b> is a wireless cyber-physical platform engineered to eliminate these bottlenecks. Combining a power-bank-powered <b>ESP-32D IoT node</b> (soil moisture, rain intensity, flood depth, IR flame detection, and a local 85dB active fire buzzer), <b>Supabase cloud telemetry sync</b> (broadcasting live alarms to all phones at <b>nino-three.vercel.app</b>), a <b>real-time Three.js 3D Digital Twin</b>, and <b>Google Gemini 3.1 Flash AI with native sensor tool calling</b>, El-Nino delivers instant hazard protection and grounded Naira (₦) agronomic guidance.",
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
        [Paragraph("<b>Hardware Component</b>", body_style), Paragraph("<b>Pin & Model Specs</b>", body_style), Paragraph("<b>Functional Responsibility in Farmland</b>", body_style)],
        [
            Paragraph("<b>Wireless MCU Node</b>", body_style),
            Paragraph("38-Pin ESP-32D (240MHz Wi-Fi) + 5V Power Bank", body_style),
            Paragraph("Runs completely cord-free via 5V power bank; polls ADC1 sensors every 500ms; streams HTTPS JSON telemetry to Vercel + Supabase (1.5s heartbeat + instant fire/rain interrupt push).", body_style)
        ],
        [
            Paragraph("<b>Soil Moisture Probes</b>", body_style),
            Paragraph("HW-080 + LM393 (GPIO 34 & VP/36 ADC1)", body_style),
            Paragraph("Reads root-zone saturation (0–100%). Detects drought (<25%), optimal moisture (30–75%), and waterlogging (>80%).", body_style)
        ],
        [
            Paragraph("<b>Raindrop Grid Sensor</b>", body_style),
            Paragraph("FC-37 Plate + LM393 (GPIO 35 ADC1)", body_style),
            Paragraph("Detects rain droplets and measures rainfall intensity (0–100%), triggering storm clouds & 2,400 3D raindrops.", body_style)
        ],
        [
            Paragraph("<b>Flood Water Level Strip</b>", body_style),
            Paragraph("Red Water Depth PCB (GPIO 32 ADC1)", body_style),
            Paragraph("Directly measures standing flash-flood depth (0–100%) on the plot, driving the rising 3D floodwater surface plane.", body_style)
        ],
        [
            Paragraph("<b>Wildfire / Flame Sensor</b>", body_style),
            Paragraph("YG1006 IR Flame Module (GPIO 33 Digital In)", body_style),
            Paragraph("Optical 760–1100nm infrared detector (Active LOW). Detects open flames/bushfires and immediately triggers both local & cloud alarms.", body_style)
        ],
        [
            Paragraph("<b>Physical & Web Fire Alarm</b>", body_style),
            Paragraph("Passive 2-Pin Buzzer (GPIO 25 PWM) + Web Audio Siren", body_style),
            Paragraph("Physical passive buzzer drives a 1800Hz/1200Hz two-tone PWM alarm locally in <20ms (even offline); Supabase sync triggers two-tone 880Hz/1320Hz siren + vibration on all judges' phones.", body_style)
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
    story.append(Paragraph("4. The 3D Farmland Digital Twin & Multi-Phone Sync", h1_style))
    story.append(Paragraph(
        "El-Nino pairs an interactive Three.js 3D Digital Twin with Supabase PostgreSQL cloud persistence (<i>farm_telemetry</i> &amp; <i>farm_alerts</i>) so every judge's phone on <b>nino-three.vercel.app</b> sees the exact same live physical farm state simultaneously:",
        body_style
    ))
    story.append(Paragraph("• <b>3D Physical Hardware Twins:</b> The interactive 3D planter box models the actual ESP-32D, Passive Buzzer halo, Soil Probe, Red Water Strip, Rain Plate, and Flame Beacon.", bullet_style))
    story.append(Paragraph("• <b>Dynamic Rain &amp; Rising Floodwater:</b> 2,400 animated sky-blue raindrops fall during precipitation while a reflective floodwater plane visibly rises over the crop ridges as moisture/water depth increases.", bullet_style))
    story.append(Paragraph("• <b>Wildfire Siren Across All Phones:</b> When flame hits GPIO 33, the physical buzzer blares and every armed browser sounds a Web Audio two-tone siren (880Hz ↔ 1320Hz) with flashing red wildfire banners.", bullet_style))

    # 5. Multimodal AI & Native Sensor Tool Calling
    story.append(Paragraph("5. AI Brain: Native Sensor Tool Calling &amp; Plant Pathology", h1_style))
    story.append(Paragraph(
        "Powered by Google Gemini 3.1 Flash (@google/genai) with real-time function calling and Nigerian domain grounding:",
        body_style
    ))
    story.append(Paragraph("• <b>Native Sensor Tool Calling:</b> Asking <i>'How is my soil moisture right now?'</i> triggers Gemini to call <b>get_live_farm_sensors()</b> and <b>get_farm_alert_history()</b> directly against Supabase before streaming grounded advice with a live sensor tool badge.", bullet_style))
    story.append(Paragraph("• <b>Plant Pathology Vision Scanner:</b> Snap or upload a leaf photo for instant diagnosis (Tomato Late Blight, Maize Rust, Cassava Mosaic), severity scoring, and knapsack dilution recipes in Nigerian Naira (₦).", bullet_style))
    story.append(Paragraph("• <b>Grounded Agronomy Database:</b> 20 staple crops (local Yoruba, Hausa, Igbo names), NPK/Urea schedules, and live market prices across Mile 12, Bodija, and Dawanau.", bullet_style))

    # Page Break for Demo & Impact
    story.append(PageBreak())

    # 6. Live Hackathon Demonstration Walkthrough
    story.append(Paragraph("6. Step-by-Step Live Hackathon Demo Script", h1_style))
    story.append(Paragraph(
        "To maximize judging score and demonstrate true wireless cyber-physical innovation, Team 8 can execute this 3-minute stage demo:",
        body_style
    ))

    demo_steps = [
        [Paragraph("<b>Demo Step</b>", body_style), Paragraph("<b>Physical Action (Stage)</b>", body_style), Paragraph("<b>App, Judges' Phones &amp; 3D Response</b>", body_style)],
        [
            Paragraph("<b>Step 1: Wireless Power-Bank Boot</b>", body_style),
            Paragraph("Plug ESP-32D into 5V Power Bank (no laptop cord!). Judges open nino-three.vercel.app &amp; tap 'Arm Phone Fire Siren'.", body_style),
            Paragraph("Active buzzer gives confirmation chirp. 3D Digital Twin turns green: 'ESP32 Live' on laptop and all judges' phones simultaneously.", body_style)
        ],
        [
            Paragraph("<b>Step 2: AI Live Sensor Tool Call</b>", body_style),
            Paragraph("Ask AI Chat: 'How is the soil moisture and fire status on my farm right now?'", body_style),
            Paragraph("Gemini invokes <b>get_live_farm_sensors()</b>, shows the green <b>AI Read Live Tool</b> badge, and reports exact real-time ESP32 readings.", body_style)
        ],
        [
            Paragraph("<b>Step 3: Flood &amp; Rain Simulation</b>", body_style),
            Paragraph("Pour water onto the FC-37 Rain Plate (G35), Soil Probe (G34), and Red Water Strip (G32).", body_style),
            Paragraph("<b>INSTANT REACTION:</b> 2,400 3D raindrops fall, storm sky activates, floodwater plane rises over ridges, and 1-click AI Drainage Plan appears.", body_style)
        ],
        [
            Paragraph("<b>Step 4: Wildfire / Flame Alarm</b>", body_style),
            Paragraph("Flick a lighter 15cm from the IR Flame Sensor (GPIO 33).", body_style),
            Paragraph("<b>INSTANT SIREN:</b> Physical buzzer (GPIO 25) blares AND every judge's phone flashes red + sounds the Web Audio wildfire siren + logs event in Supabase.", body_style)
        ],
        [
            Paragraph("<b>Step 5: Plant Pathology Scan</b>", body_style),
            Paragraph("Upload photo of a diseased tomato leaf with late blight lesions.", body_style),
            Paragraph("Gemini diagnoses <b>[Tomato Late Blight • High Severity]</b>, prescribes Ridomil Gold knapsack dosage, and quotes cost in Nigerian Naira (₦).", body_style)
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
