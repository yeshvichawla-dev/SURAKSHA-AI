"""Insert clearly-labelled DEMO hazards (not real reports).

Usage:  python seed_demo.py            add demo data (once)
        python seed_demo.py --clear    remove all demo data
"""
import sys
from datetime import datetime, timedelta, timezone

from app.database import Base, SessionLocal, engine
from app.models import Hazard

Base.metadata.create_all(bind=engine)

CENTER = (28.6139, 77.2090)  # Delhi NCR default map view
# (category, severity, status, d_lat, d_lng, hours_ago, confirmations, text)
DEMO = [
    ("pothole", "high", "active", 0.012, 0.010, 5, 4, "Deep pothole in left lane."),
    ("waterlogging", "critical", "active", -0.008, 0.015, 2, 5, "Knee-deep water after rain, small vehicles stalling."),
    ("construction", "medium", "active", 0.004, -0.012, 72, 1, "Lane closed for pipe laying."),
    ("accident", "high", "under_review", -0.015, -0.006, 1, 2, "Two-vehicle collision, one lane blocked."),
    ("road_blockage", "critical", "active", 0.020, -0.018, 9, 3, "Fallen tree across both lanes."),
    ("damaged_road", "medium", "active", -0.003, 0.004, 200, 0, "Cracked and uneven surface for ~30 m."),
    ("traffic_obstruction", "low", "active", 0.007, 0.021, 4, 0, "Stationary delivery truck narrowing the road."),
    ("pothole", "medium", "active", 0.0125, 0.0105, 30, 1, "Pothole near the same spot, right lane."),
    ("pothole", "low", "resolved", -0.011, -0.014, 600, 2, "Patched last week."),
    ("other", "low", "active", 0.001, 0.009, 800, 0, "Broken divider reflector."),
]

db = SessionLocal()
if "--clear" in sys.argv:
    n = db.query(Hazard).filter(Hazard.is_demo.is_(True)).delete()
    db.commit()
    print(f"Removed {n} demo hazards.")
elif db.query(Hazard).filter(Hazard.is_demo.is_(True)).count():
    print("Demo data already present. Use --clear to remove it first.")
else:
    now = datetime.now(timezone.utc)
    for cat, sev, st, dlat, dlng, hrs, conf, text in DEMO:
        ts = now - timedelta(hours=hrs)
        db.add(Hazard(
            category=cat, severity=sev, status=st, lat=CENTER[0] + dlat, lng=CENTER[1] + dlng,
            description=f"[DEMO DATA] {text}", confirmations=conf, is_demo=True,
            verification="community_confirmed" if conf >= 3 else "unverified",
            created_at=ts, updated_at=ts,
        ))
    db.commit()
    print(f"Added {len(DEMO)} DEMO hazards around Delhi NCR.")
db.close()
