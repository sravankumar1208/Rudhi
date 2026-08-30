package com.rudhi.app.ui.donor

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.rudhi.app.data.repository.BloodRequestRepository
import com.rudhi.app.databinding.ActivityDonorAlertBinding
import kotlinx.coroutines.launch

class DonorAlertActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDonorAlertBinding
    private val bloodRequestRepo = BloodRequestRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDonorAlertBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val requestId = intent.getStringExtra("REQUEST_ID") ?: ""
        val hospitalName = intent.getStringExtra("HOSPITAL_NAME") ?: "Hospital"
        val patientName = intent.getStringExtra("PATIENT_NAME") ?: "Patient"
        val bloodGroup = intent.getStringExtra("BLOOD_GROUP") ?: "O+"
        val units = intent.getIntExtra("UNITS_NEEDED", 1)
        val urgency = intent.getStringExtra("URGENCY") ?: "CRITICAL"

        binding.tvAlertBloodGroup.text = bloodGroup
        binding.tvAlertHospital.text = hospitalName
        binding.tvAlertPatient.text = "Patient: $patientName"
        binding.tvAlertUnits.text = "Units Required: $units"
        binding.tvAlertUrgency.text = urgency.uppercase()

        binding.btnAcceptAndNavigate.setOnClickListener {
            lifecycleScope.launch {
                bloodRequestRepo.respondToRequest(requestId, "accepted")

                val gmmIntentUri = Uri.parse("google.navigation:q=${Uri.encode(hospitalName)}")
                val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri)
                mapIntent.setPackage("com.google.android.apps.maps")
                if (mapIntent.resolveActivity(packageManager) != null) {
                    startActivity(mapIntent)
                }

                val navIntent = Intent(this@DonorAlertActivity, DonorNavigationActivity::class.java).apply {
                    putExtra("REQUEST_ID", requestId)
                    putExtra("HOSPITAL_NAME", hospitalName)
                    putExtra("PATIENT_NAME", patientName)
                }
                startActivity(navIntent)
                finish()
            }
        }

        binding.btnDecline.setOnClickListener {
            lifecycleScope.launch {
                bloodRequestRepo.respondToRequest(requestId, "declined")
                finish()
            }
        }
    }
}
