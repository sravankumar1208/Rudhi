package com.rudhi.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Hospital(
    val id: String = "",
    val name: String = "",
    val address: String = "",
    val phone: String = "",
    val type: String = "Hospital",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val distanceKm: Double = 2.4
)
