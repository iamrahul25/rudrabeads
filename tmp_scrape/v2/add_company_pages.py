"""Add About Us / Contact Us / Testimonial content from rudrabeads.in to catalog.json `business`.

Sources (downloaded to tmp_scrape/v2/pages): profile.html, enquiry.html, testimonial.html.
The mobile number comes from the signboard photo on profile.html (Our Infrastructure).
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TARGETS = [ROOT / "src" / "data" / "catalog.json", ROOT / "catalog.json"]

ADDITIONS = {
    "city": "Ghaziabad, Uttar Pradesh",
    "mobile": "+91 8130260949",
    "whatsapp": "918130260949",
    "location": {"lat": 28.68744, "lng": 77.33448},
    "about": {
        "paragraphs": [
            'Established in the year of 2025, We "Rudra Beads" Manufacturer of Rudraksha Mala, '
            "Rudraksha Bead, Sapphire Gemstone, Indonesian Rudraksha Etc. We direct all our activities "
            "to cater the expectations of customers by providing them excellent quality products as per "
            "their gratification. Moreover, we follow moral business policies and crystal pure "
            "transparency in all our transactions to keep healthy relations with the customers.",
            "For our accomplishment story, we are grateful to Mr. Sahil Ahuja whose continual backing "
            "and direction have been useful to us for attaining exponential development in the current market.",
        ],
        "factsheet": [
            {
                "title": "Basic Information",
                "rows": [
                    ["Nature of Business", "Trader - Retailer"],
                    ["Additional Business", "Retail Business"],
                    ["Company CEO", "Sahil Ahuja"],
                    ["Registered Address", "B-139, Shalimar Garden Main, Sahibabad, Ghaziabad- 201005, Uttar Pradesh, India"],
                    ["Total Number of Employees", "Upto 10 People"],
                    ["GST Registration Date", "19-09-2025"],
                    ["Legal Status of Firm", "Proprietorship"],
                    ["Annual Turnover", "40 L - 1.5 Cr"],
                    ["GST Partner Name", "Sahil Ahuja"],
                ],
            },
            {
                "title": "Statutory Profile",
                "rows": [
                    ["Banker", "Kotak Mahindra Bank"],
                    ["GST No.", "09EEQPA4774B1ZE"],
                ],
            },
            {
                "title": "Packaging/Payment and Shipment Details",
                "rows": [
                    ["Payment Mode", "Cash, Credit Card, Online, Cheque"],
                    ["Shipment Mode", "By Road"],
                ],
            },
        ],
        "whyUs": {
            "intro": "Our specialties, which make us a valuable business partner for our clients, include the following:",
            "points": [
                "Maintain strict adherence to the highest quality standards and parameters",
                "Long and diverse domestic market experience",
                "On-Time Delivery",
                "Reasonable product Pricing",
                "Excellent After-Sales Support",
            ],
        },
        "photos": [
            {"section": "Our Warehouse", "title": "Our Stock", "image": "assets/company/stock.webp", "width": 1000, "height": 632},
            {"section": "Our Infrastructure", "title": "Our Signboard", "image": "assets/company/signboard.webp", "width": 1000, "height": 750},
            {"section": "Infrastructural Set-Up", "title": "Our Office", "image": "assets/company/office.webp", "width": 800, "height": 1000},
        ],
    },
    "testimonials": {
        "rating": 5,
        "outOf": 5,
        "satisfaction": [
            {"label": "Response", "percent": 100},
            {"label": "Quality", "percent": 100},
            {"label": "Delivery", "percent": 100},
        ],
        "reviews": [
            {
                "name": "Abhishek Sharma",
                "location": "Bharatpur, Rajasthan",
                "rating": 5,
                "date": "2026-07-06",
                "product": "Rudraksha Beads",
                "tags": ["Response", "Quality", "Delivery"],
            },
            {
                "name": "Sahil Ahuja",
                "location": "Ghaziabad, Uttar Pradesh",
                "rating": 5,
                "date": "2025-10-24",
                "product": "14 Mukhi Rudraksha",
                "tags": [],
            },
        ],
    },
}

for path in TARGETS:
    catalog = json.loads(path.read_text(encoding="utf-8"))
    catalog["business"].update(ADDITIONS)
    path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print("updated", path.relative_to(ROOT))
