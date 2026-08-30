package com.rudhi.app.data.repository

import com.rudhi.app.data.model.Hospital
import com.rudhi.app.data.network.SupabaseClient

class HospitalRepository {
    private val postgrest get() = SupabaseClient.postgrest

    suspend fun getHospitals(): List<Hospital> {
        return try {
            postgrest["hospitals"]
                .select()
                .decodeList<Hospital>()
        } catch (e: Exception) {
            e.printStackTrace()
            getMockHospitals()
        }
    }

    private fun getMockHospitals(): List<Hospital> {
        return listOf(
            Hospital(
                id = "hosp_1",
                name = "Stanley Medical College & Hospital",
                address = "Old Jail Rd, Royapuram, Chennai, Tamil Nadu",
                phone = "+91 44 2528 1351",
                type = "Government Hospital & Blood Bank",
                latitude = 13.1077,
                longitude = 80.2872,
                distanceKm = 1.8
            ),
            Hospital(
                id = "hosp_2",
                name = "Apollo Hospitals",
                address = "Greams Road, Thousand Lights, Chennai, Tamil Nadu",
                phone = "+91 44 2829 0200",
                type = "Super Specialty Hospital",
                latitude = 13.0617,
                longitude = 80.2520,
                distanceKm = 3.2
            ),
            Hospital(
                id = "hosp_3",
                name = "Rajiv Gandhi Government General Hospital",
                address = "EVR Periyar Salai, Park Town, Chennai, Tamil Nadu",
                phone = "+91 44 2530 5000",
                type = "Government Medical College",
                latitude = 13.0827,
                longitude = 80.2755,
                distanceKm = 4.1
            ),
            Hospital(
                id = "hosp_4",
                name = "Fortis Malar Hospital",
                address = "First Main Road, Gandhi Nagar, Adyar, Chennai",
                phone = "+91 44 4289 2222",
                type = "Multi Specialty Hospital",
                latitude = 13.0062,
                longitude = 80.2575,
                distanceKm = 6.5
            )
        )
    }
}
