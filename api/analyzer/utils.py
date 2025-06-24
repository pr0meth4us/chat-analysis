import numpy as np
import pandas as pd
from datetime import datetime, date
from typing import Any, Dict, List, Union


class AnalysisUtils:
    """Utility class for analysis helper functions."""

    @staticmethod
    def convert_to_serializable(obj: Any) -> Any:
        """Convert various Python objects to JSON-serializable formats."""
        if isinstance(obj, (np.integer, np.int64, np.int32)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float64, np.float32)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, pd.Series):
            return obj.to_dict()
        if isinstance(obj, (datetime, pd.Timestamp, date)):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {AnalysisUtils.convert_to_serializable(k): AnalysisUtils.convert_to_serializable(v) for k, v in
                    obj.items()}
        if isinstance(obj, (list, tuple)):
            return [AnalysisUtils.convert_to_serializable(i) for i in obj]
        if pd.isna(obj):
            return None
        return obj