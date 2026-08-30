package com.rudhi.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val id: String = "",
    val email: String? = null,
    @SerialName("full_name") val fullName: String? = null,
    val phone: String? = null,
    @SerialName("blood_group") val bloodGroup: String? = null,
    val role: String? = "donor",
    val address: String? = null,
    @SerialName("is_available") val isAvailable: Boolean = true,
    @SerialName("last_donation") val lastDonation: String? = null,
    @SerialName("cooldown_ends_at") val cooldownEndsAt: String? = null,
    @SerialName("donation_count") val donationCount: Int = 0
)
