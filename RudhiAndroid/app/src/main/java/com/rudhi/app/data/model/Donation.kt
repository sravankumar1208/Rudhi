package com.rudhi.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Donation(
    val id: String = "",
    @SerialName("donor_id") val donorId: String = "",
    @SerialName("request_id") val requestId: String? = null,
    @SerialName("hospital_name") val hospitalName: String = "",
    @SerialName("units_donated") val unitsDonated: Int = 1,
    val status: String = "confirmed",
    @SerialName("proof_url") val proofUrl: String? = null,
    val feedback: String? = null,
    @SerialName("donated_at") val donatedAt: String? = null
)
