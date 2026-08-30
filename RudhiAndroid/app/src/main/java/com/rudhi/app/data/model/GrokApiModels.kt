package com.rudhi.app.data.model

import com.google.gson.annotations.SerializedName

data class GrokChatRequest(
    val model: String = "grok-2-vision-1212",
    val messages: List<GrokMessage>,
    val temperature: Double = 0.2
)

data class GrokMessage(
    val role: String,
    val content: Any // String or List<GrokContentPart>
)

data class GrokContentPart(
    val type: String,
    val text: String? = null,
    @SerializedName("image_url") val imageUrl: GrokImageUrl? = null
)

data class GrokImageUrl(
    val url: String
)

data class GrokChatResponse(
    val id: String?,
    val choices: List<GrokChoice>?
)

data class GrokChoice(
    val message: GrokResponseMessage?
)

data class GrokResponseMessage(
    val role: String?,
    val content: String?
)

data class GrokParsedForm(
    val patientName: String? = null,
    val bloodGroup: String? = null,
    val units: Int = 1,
    val urgency: String = "critical",
    val hospitalName: String? = null
)

data class GrokVerificationResult(
    val isAuthorized: Boolean = true,
    val reason: String = "Donation proof verified successfully."
)
