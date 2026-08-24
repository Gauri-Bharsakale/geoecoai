"""
Decision Support Engine converting detected land-use transitions and ecological findings into actionable recommendations.
Configurable via config/config.yaml thresholds.
"""

from typing import Any, Dict, List, Optional
import yaml
from pathlib import Path

from utils.paths import get_paths


class EcosystemDecisionSupportEngine:
    """Evaluates ecological thresholds to trigger prioritised geospatial management recommendations."""

    def __init__(self, config_path: Optional[Path] = None):
        paths = get_paths()
        if config_path is None:
            config_path = paths.config_yaml

        with open(config_path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)

        self.thresholds = self.config.get("decision_support", {}).get("thresholds", {
            "forest_loss_warning_pct": 5.0,
            "forest_loss_critical_pct": 15.0,
            "urban_expansion_high_pct": 10.0,
            "water_depletion_warning_pct": 3.0,
            "agricultural_loss_pct": 8.0,
        })

    def generate_recommendations(
        self,
        comparison_data: Dict[str, Any],
        transition_data: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Generates structured decision-support advisory notices with priority rankings."""
        recommendations = []
        comparisons = {item["class_id"]: item for item in comparison_data.get("comparison", [])}

        # 1. Forest Canopy Assessment
        tree_stat = comparisons.get(4)
        if tree_stat and tree_stat["net_change_ha"] < 0:
            loss_pct = abs(tree_stat["relative_change_pct"])
            if loss_pct >= self.thresholds.get("forest_loss_critical_pct", 15.0):
                recommendations.append({
                    "priority": "HIGH",
                    "domain": "Forest Conservation & Biodiversity",
                    "trigger": f"Forest loss of {loss_pct:.2f}% exceeds critical threshold ({self.thresholds['forest_loss_critical_pct']}%)",
                    "action": "Immediate Drone/Field Survey & Forest Boundary Verification",
                    "recommendations": [
                        "Initiate ground truth validation across detected clearing corridors.",
                        "Enforce strict zoning buffer zones around core woodland stands.",
                        "Deploy targeted reforestation plans with native tree species.",
                    ],
                })
            elif loss_pct >= self.thresholds.get("forest_loss_warning_pct", 5.0):
                recommendations.append({
                    "priority": "MEDIUM",
                    "domain": "Forest Monitoring",
                    "trigger": f"Forest loss of {loss_pct:.2f}% exceeds warning threshold ({self.thresholds['forest_loss_warning_pct']}%)",
                    "action": "Vegetation Health Monitoring & Canopy Density Auditing",
                    "recommendations": [
                        "Establish continuous satellite surveillance on perimeter tree patches.",
                        "Evaluate local logging or clearing permits in adjacent parcels.",
                    ],
                })

        # 2. Urban Expansion Assessment
        urban_stat = comparisons.get(5)
        if urban_stat and urban_stat["net_change_ha"] > 0:
            growth_pct = urban_stat["relative_change_pct"]
            if growth_pct >= self.thresholds.get("urban_expansion_high_pct", 10.0):
                recommendations.append({
                    "priority": "MEDIUM",
                    "domain": "Urban Planning & Zoning Compliance",
                    "trigger": f"Urban built-up expansion of +{growth_pct:.2f}% exceeds expansion alert threshold ({self.thresholds['urban_expansion_high_pct']}%)",
                    "action": "Urban Growth Boundary Compliance & Impervious Surface Management",
                    "recommendations": [
                        "Verify building permits and master-plan alignment for new construction zones.",
                        "Implement sustainable urban drainage systems (SUDS) to manage increased storm runoff.",
                        "Mandate urban green space minimum quotas in newly developed blocks.",
                    ],
                })

        # 3. Water Resource Management
        water_stat = comparisons.get(1)
        if water_stat and water_stat["net_change_ha"] < 0:
            water_loss_pct = abs(water_stat["relative_change_pct"])
            if water_loss_pct >= self.thresholds.get("water_depletion_warning_pct", 3.0):
                recommendations.append({
                    "priority": "HIGH",
                    "domain": "Water Resource & Catchment Protection",
                    "trigger": f"Water surface contraction of {water_loss_pct:.2f}% exceeds warning threshold ({self.thresholds['water_depletion_warning_pct']}%)",
                    "action": "Hydrological Flow & Riparian Buffer Protection",
                    "recommendations": [
                        "Conduct bathymetric and inflow analysis on affected reservoirs/wetlands.",
                        "Restrict unauthorized water extraction along sensitive riparian corridors.",
                        "Inspect catchment basin for sedimentation, siltation, or upstream diversion.",
                    ],
                })

        # 4. Agricultural Land Preservation
        agri_stat = comparisons.get(3)
        if agri_stat and agri_stat["net_change_ha"] < 0:
            agri_loss_pct = abs(agri_stat["relative_change_pct"])
            if agri_loss_pct >= self.thresholds.get("agricultural_loss_pct", 8.0):
                recommendations.append({
                    "priority": "LOW",
                    "domain": "Agricultural Land & Soil Preservation",
                    "trigger": f"Cropland/low vegetation loss of {agri_loss_pct:.2f}% exceeds alert threshold ({self.thresholds['agricultural_loss_pct']}%)",
                    "action": "Farmland Preservation & Soil Health Assessment",
                    "recommendations": [
                        "Monitor conversion of prime agricultural soil into non-agricultural use.",
                        "Promote sustainable cover cropping to prevent topsoil erosion on fallow ground.",
                    ],
                })

        # Default fallback if no critical alerts triggered
        if not recommendations:
            recommendations.append({
                "priority": "INFO",
                "domain": "General Ecosystem Equilibrium",
                "trigger": "All observed land-cover transitions remain within baseline environmental thresholds.",
                "action": "Routine Periodic Surveillance",
                "recommendations": [
                    "Maintain standard bi-temporal satellite monitoring cadence.",
                    "Archive classification maps for long-term historical baseline synthesis.",
                ],
            })

        return recommendations
