"""
Rule-based environmental analysis module generating objective, scientifically grounded ecosystem insights.
Adheres strictly to evidence-based observations without claiming unwarranted causality.
"""

from typing import Any, Dict, List
import numpy as np


class RuleBasedEnvironmentalAnalyzer:
    """Evaluates multi-temporal land cover dynamics to generate calibrated ecological findings."""

    def __init__(self):
        pass

    def generate_findings(self, comparison_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Synthesizes factual environmental observations based on detected temporal transitions."""
        findings = []
        comparisons = comparison_data.get("comparison", [])

        # Find classes
        class_map = {item["class_id"]: item for item in comparisons}

        # 1. Forest / Tree Canopy Dynamics (Class 4)
        tree_stat = class_map.get(4)
        if tree_stat:
            net_ha = tree_stat["net_change_ha"]
            rel_pct = tree_stat["relative_change_pct"]
            if net_ha < 0:
                findings.append({
                    "topic": "Forest & Tree Canopy Dynamics",
                    "severity": "CRITICAL" if abs(rel_pct) > 10.0 else "WARNING",
                    "trend": "REDUCTION",
                    "metric_summary": f"{abs(net_ha):.2f} ha ({abs(rel_pct):.2f}%) reduction",
                    "statement": (
                        "A decrease in the area classified as forest/tree canopy was detected between the analyzed periods. "
                        "This spatial pattern indicates potential canopy thinning or forest fragmentation in the study scene."
                    ),
                    "ecological_implication": "Loss of woody vegetation may reduce carbon sequestration and wildlife habitat connectivity.",
                })
            elif net_ha > 0:
                findings.append({
                    "topic": "Forest & Tree Canopy Dynamics",
                    "severity": "POSITIVE",
                    "trend": "EXPANSION",
                    "metric_summary": f"+{net_ha:.2f} ha (+{rel_pct:.2f}%) expansion",
                    "statement": (
                        "An increase in the area classified as tree canopy was detected between the temporal periods. "
                        "This observation suggests possible afforestation, canopy growth, or vegetation recovery."
                    ),
                    "ecological_implication": "Vegetation regrowth promotes local biodiversity and watershed stabilization.",
                })

        # 2. Urban & Built-up Land Dynamics (Class 5)
        urban_stat = class_map.get(5)
        if urban_stat:
            net_ha = urban_stat["net_change_ha"]
            rel_pct = urban_stat["relative_change_pct"]
            if net_ha > 0:
                findings.append({
                    "topic": "Urban & Infrastructure Expansion",
                    "severity": "WARNING" if rel_pct > 5.0 else "INFO",
                    "trend": "EXPANSION",
                    "metric_summary": f"+{net_ha:.2f} ha (+{rel_pct:.2f}%) expansion",
                    "statement": (
                        "An increase in the area classified as urban/built-up land was detected. "
                        "This spatial trend indicates active infrastructure development or residential expansion."
                    ),
                    "ecological_implication": "Impervious surface proliferation may exacerbate urban heat island effects and alter surface runoff.",
                })

        # 3. Water Body Dynamics (Class 1)
        water_stat = class_map.get(1)
        if water_stat:
            net_ha = water_stat["net_change_ha"]
            rel_pct = water_stat["relative_change_pct"]
            if net_ha < 0:
                findings.append({
                    "topic": "Hydrological Surface Dynamics",
                    "severity": "WARNING" if abs(rel_pct) > 3.0 else "INFO",
                    "trend": "REDUCTION",
                    "metric_summary": f"{abs(net_ha):.2f} ha ({abs(rel_pct):.2f}%) reduction",
                    "statement": (
                        "A reduction in classified water area was detected between the temporal observations. "
                        "This pattern may reflect seasonal fluctuation, surface desiccation, or water extraction."
                    ),
                    "ecological_implication": "Contracting surface water bodies can stress local aquatic ecosystems and seasonal water tables.",
                })
            elif net_ha > 0:
                findings.append({
                    "topic": "Hydrological Surface Dynamics",
                    "severity": "INFO",
                    "trend": "EXPANSION",
                    "metric_summary": f"+{net_ha:.2f} ha (+{rel_pct:.2f}%) expansion",
                    "statement": (
                        "An expansion in classified water body surface was detected. "
                        "This may correspond to precipitation accumulation, reservoir filling, or seasonal inundation."
                    ),
                    "ecological_implication": "Expanded surface water reservoirs support local microclimate moderation.",
                })

        # 4. Low Vegetation / Agricultural Shifts (Class 3)
        veg_stat = class_map.get(3)
        if veg_stat:
            net_ha = veg_stat["net_change_ha"]
            rel_pct = veg_stat["relative_change_pct"]
            if net_ha > 0:
                findings.append({
                    "topic": "Agricultural & Low Vegetation Dynamics",
                    "severity": "INFO",
                    "trend": "EXPANSION",
                    "metric_summary": f"+{net_ha:.2f} ha (+{rel_pct:.2f}%) expansion",
                    "statement": (
                        "An increase in classified agricultural/low vegetation area was detected. "
                        "This pattern suggests agricultural cultivation, grassland greening, or seasonal vegetative emergence."
                    ),
                    "ecological_implication": "Active vegetative coverage provides topsoil protection against wind and water erosion.",
                })
            elif net_ha < 0:
                findings.append({
                    "topic": "Agricultural & Low Vegetation Dynamics",
                    "severity": "WARNING" if abs(rel_pct) > 8.0 else "INFO",
                    "trend": "REDUCTION",
                    "metric_summary": f"{abs(net_ha):.2f} ha ({abs(rel_pct):.2f}%) reduction",
                    "statement": (
                        "A reduction in classified agricultural/low vegetation area was detected. "
                        "This observation indicates potential conversion to bare soil, harvesting cycles, or land conversion."
                    ),
                    "ecological_implication": "Agricultural land conversion may impact localized food production capacity.",
                })

        return findings
