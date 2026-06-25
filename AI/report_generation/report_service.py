from typing import List

from .schemas import GeneratedReportResponse, ReportRequest


NEGATIVE_EMOTIONS = {
    "angry",
    "disgust",
    "fear",
    "sad",
}


def _format_name(value: str) -> str:
    return value.replace("_", " ").strip().title()


def _get_emotion_counts(request: ReportRequest) -> dict:
    counts = request.statistics.emotionCounts

    return {
        "angry": counts.angry,
        "disgust": counts.disgust,
        "fear": counts.fear,
        "happy": counts.happy,
        "neutral": counts.neutral,
        "sad": counts.sad,
        "surprise": counts.surprise,
        "unknown": counts.unknown,
    }


def _get_modality_counts(request: ReportRequest) -> dict:
    counts = request.statistics.modalityCounts

    return {
        "text": counts.text,
        "image": counts.image,
        "voice": counts.voice,
    }


def _build_emotion_distribution(request: ReportRequest) -> str:
    emotion_counts = _get_emotion_counts(request)

    detected_emotions = [
        f"{_format_name(emotion)}: {count}"
        for emotion, count in emotion_counts.items()
        if count > 0
    ]

    if not detected_emotions:
        return "No clear emotional distribution was available."

    return ", ".join(detected_emotions)


def _build_modality_distribution(request: ReportRequest) -> str:
    modality_counts = _get_modality_counts(request)

    used_modalities = [
        f"{_format_name(modality)}: {count}"
        for modality, count in modality_counts.items()
        if count > 0
    ]

    if not used_modalities:
        return "No analysis modality information was available."

    return ", ".join(used_modalities)


def _build_patterns_text(request: ReportRequest) -> str:
    patterns = request.statistics.recurringPatterns

    if not patterns:
        return "No recurring context was detected more than once."

    return ", ".join(patterns)


def _get_negative_count(analyses: list) -> int:
    return sum(
        1
        for analysis in analyses
        if analysis.isReliable
        and analysis.emotion in NEGATIVE_EMOTIONS
    )


def _build_emotional_trend(request: ReportRequest) -> str:
    analyses = sorted(
        request.analyses,
        key=lambda analysis: analysis.createdAt,
    )

    if len(analyses) < 4:
        return (
            "The available records are not sufficient to identify "
            "a reliable time-based emotional trend."
        )

    middle_index = len(analyses) // 2

    first_period = analyses[:middle_index]
    second_period = analyses[middle_index:]

    first_negative_count = _get_negative_count(first_period)
    second_negative_count = _get_negative_count(second_period)

    if second_negative_count < first_negative_count:
        return (
            "Negative emotional indicators appeared less frequently "
            "during the later part of the selected period. This may "
            "suggest a positive change, but additional observations "
            "are required."
        )

    if second_negative_count > first_negative_count:
        return (
            "Negative emotional indicators appeared more frequently "
            "during the later part of the selected period. Continued "
            "observation and professional follow-up may be useful."
        )

    return (
        "The frequency of negative emotional indicators remained "
        "generally similar across the selected period. No clear "
        "directional change was identified."
    )


def _shows_improvement(request: ReportRequest) -> bool:
    analyses = sorted(
        request.analyses,
        key=lambda analysis: analysis.createdAt,
    )

    if len(analyses) < 4:
        return False

    middle_index = len(analyses) // 2

    first_negative_count = _get_negative_count(
        analyses[:middle_index]
    )
    second_negative_count = _get_negative_count(
        analyses[middle_index:]
    )

    return second_negative_count < first_negative_count


def _determine_overall_status(request: ReportRequest) -> str:
    if request.analysisCount < 3:
        return "insufficient_data"

    dominant_emotion = (
        request.statistics.dominantEmotion.strip().lower()
    )

    reliable_ratio = (
        request.statistics.reliableCount
        / request.analysisCount
    )

    has_recurring_patterns = bool(
        request.statistics.recurringPatterns
    )

    if (
        dominant_emotion in NEGATIVE_EMOTIONS
        and reliable_ratio >= 0.5
    ):
        return "needs_attention"

    if has_recurring_patterns:
        return "needs_attention"

    if _shows_improvement(request):
        return "improving"

    return "stable"


def _build_parent_summary(request: ReportRequest) -> str:
    dominant_emotion = _format_name(
        request.statistics.dominantEmotion
    )

    return (
        f"During the selected period, "
        f"{request.analysisCount} emotional analyses were reviewed. "
        f"The most frequently detected emotional result was "
        f"{dominant_emotion}. The average confidence level was "
        f"{request.statistics.averageConfidence:.2f}%, and "
        f"{request.statistics.reliableCount} results were marked "
        f"as reliable. These findings can support continued "
        f"observation, but they do not represent a final diagnosis."
    )


def _build_doctor_summary(request: ReportRequest) -> str:
    dominant_emotion = _format_name(
        request.statistics.dominantEmotion
    )

    return (
        f"A total of {request.analysisCount} analysis records were "
        f"reviewed for the selected reporting period. "
        f"{dominant_emotion} was the dominant detected emotional "
        f"result. The average model confidence was "
        f"{request.statistics.averageConfidence:.2f}%, with "
        f"{request.statistics.reliableCount} reliable results and "
        f"{request.statistics.unreliableCount} results requiring "
        f"cautious interpretation."
    )


def _build_parent_report(request: ReportRequest) -> str:
    modality_distribution = _build_modality_distribution(request)
    emotion_distribution = _build_emotion_distribution(request)
    emotional_trend = _build_emotional_trend(request)
    patterns_text = _build_patterns_text(request)

    return "\n\n".join(
        [
            (
                f"The report covers {request.analysisCount} analyses "
                f"for {request.child.childName} during the selected "
                f"period."
            ),
            (
                f"Analysis types included: "
                f"{modality_distribution}."
            ),
            (
                f"Detected emotion distribution: "
                f"{emotion_distribution}."
            ),
            emotional_trend,
            (
                f"Recurring observations: {patterns_text}."
            ),
            (
                "The results should be used as supporting information "
                "to help the parent observe emotional changes and "
                "communicate with the child. They should not be used "
                "as a final medical or psychological diagnosis."
            ),
        ]
    )


def _build_doctor_report(request: ReportRequest) -> str:
    modality_distribution = _build_modality_distribution(request)
    emotion_distribution = _build_emotion_distribution(request)
    emotional_trend = _build_emotional_trend(request)
    patterns_text = _build_patterns_text(request)

    return "\n\n".join(
        [
            (
                f"The reporting dataset contains "
                f"{request.analysisCount} analysis records for "
                f"{request.child.childName}."
            ),
            (
                f"Modality distribution: "
                f"{modality_distribution}."
            ),
            (
                f"Emotion distribution: "
                f"{emotion_distribution}."
            ),
            (
                f"Average confidence: "
                f"{request.statistics.averageConfidence:.2f}%. "
                f"Reliable results: "
                f"{request.statistics.reliableCount}. "
                f"Unreliable results: "
                f"{request.statistics.unreliableCount}."
            ),
            emotional_trend,
            (
                f"Recurring contextual patterns: "
                f"{patterns_text}."
            ),
            (
                "The findings should be compared with direct "
                "professional assessment, parent observations, "
                "behavioral history, and relevant environmental "
                "factors. The AI-generated report is intended as "
                "a follow-up support tool and not as an independent "
                "clinical diagnosis."
            ),
        ]
    )


def _build_parent_recommendations(
    request: ReportRequest,
) -> List[str]:
    recommendations = [
        "Encourage the child to speak openly about their feelings.",
        "Listen to the child without criticism or pressure.",
        "Continue monitoring emotional changes over time.",
        (
            "Contact the follow-up doctor if concerning patterns "
            "continue or become stronger."
        ),
    ]

    if request.statistics.recurringPatterns:
        recommendations.append(
            (
                "Observe the situations connected with the recurring "
                "patterns identified in the report."
            )
        )

    if (
        request.statistics.dominantEmotion
        .strip()
        .lower()
        in NEGATIVE_EMOTIONS
    ):
        recommendations.append(
            (
                "Pay attention to when the dominant negative emotion "
                "appears and what situations may trigger it."
            )
        )

    return recommendations


def _build_doctor_recommendations(
    request: ReportRequest,
) -> List[str]:
    recommendations = [
        (
            "Compare the report findings with direct professional "
            "assessment and behavioral observations."
        ),
        (
            "Review unreliable or low-confidence results separately "
            "before including them in any conclusion."
        ),
        (
            "Compare the selected period with previous and future "
            "reports to identify longer-term changes."
        ),
        (
            "Document any difference between the application results "
            "and direct clinical observations."
        ),
    ]

    if request.statistics.recurringPatterns:
        recommendations.append(
            (
                "Explore the repeated contextual patterns during "
                "the next follow-up session."
            )
        )

    if (
        request.statistics.dominantEmotion
        .strip()
        .lower()
        in NEGATIVE_EMOTIONS
    ):
        recommendations.append(
            (
                "Assess whether the dominant emotional indicator is "
                "associated with specific social, family, school, "
                "or environmental factors."
            )
        )

    return recommendations


def generate_report(
    request: ReportRequest,
) -> GeneratedReportResponse:
    overall_status = _determine_overall_status(request)

    if request.requestedByRole == "doctor":
        summary = _build_doctor_summary(request)
        report = _build_doctor_report(request)
        recommendations = _build_doctor_recommendations(request)
    else:
        summary = _build_parent_summary(request)
        report = _build_parent_report(request)
        recommendations = _build_parent_recommendations(request)

    return GeneratedReportResponse(
        summary=summary,
        report=report,
        recommendations=recommendations,
        overallStatus=overall_status,
    )