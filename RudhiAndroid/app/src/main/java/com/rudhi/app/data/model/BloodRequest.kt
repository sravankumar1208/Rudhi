package com.rudhi.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BloodRequest(
    val id: String = "",
    @SerialName("requester_id") val requesterId: String? = null,
    @SerialName("hospital_name") val hospitalName: String = "",
    @SerialName("hospital_address") val hospitalAddress: String? = null,
    @SerialName("patient_name") val patientName: String = "",
    @SerialName("receiver_address") val receiverAddress: String? = null,
    @SerialName("blood_group") val bloodGroup: String = "O+",
    @SerialName("units_needed") val unitsNeeded: Int = 1,
    val urgency: String = "critical",
    val status: String = "searching",
    @SerialName("sms_enabled") val smsEnabled: Boolean = true,
    @SerialName("alert_radius_km") val alertRadiusKm: Int = 10,
    @SerialName("donors_pinged") val donorsPinged: Int = 0,
    @SerialName("created_at") val createdAt: String? = null
)
