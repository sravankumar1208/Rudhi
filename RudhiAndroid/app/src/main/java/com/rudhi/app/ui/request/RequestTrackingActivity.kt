package com.rudhi.app.ui.request

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.rudhi.app.databinding.ActivityRequestTrackingBinding

class RequestTrackingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRequestTrackingBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRequestTrackingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val hospitalName = intent.getStringExtra("HOSPITAL_NAME") ?: "Hospital"
        val patientName = intent.getStringExtra("PATIENT_NAME") ?: "Patient"
        val units = intent.getIntExtra("UNITS", 1)

        binding.tvTrackingRequestInfo.text = "$units Unit(s) needed for $patientName at $hospitalName"

        binding.btnBackHome.setOnClickListener {
            finish()
        }
    }
}
