package com.rudhi.app.ui.request

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.rudhi.app.R
import com.rudhi.app.data.model.BloodRequest
import com.rudhi.app.databinding.ActivityRequestBloodBinding

class RequestBloodActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRequestBloodBinding
    private val viewModel: RequestBloodViewModel by viewModels()
    private var unitsCount = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRequestBloodBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupHospitalAutocomplete()
        setupListeners()
        observeViewModel()
    }

    private fun setupHospitalAutocomplete() {
        val hospitals = listOf(
            "Stanley Medical College & Hospital",
            "Apollo Hospital, Greams Road",
            "Rajiv Gandhi Government General Hospital",
            "Fortis Malar Hospital, Adyar",
            "MIOT International Hospital"
        )
        val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, hospitals)
        binding.actHospital.setAdapter(adapter)
    }

    private fun setupListeners() {
        // Toggle AI section
        binding.btnToggleAi.setOnClickListener {
            val isVisible = binding.cardAiPrompt.visibility == View.VISIBLE
            binding.cardAiPrompt.visibility = if (isVisible) View.GONE else View.VISIBLE
        }

        // Parse AI Prompt
        binding.btnParseAi.setOnClickListener {
            val prompt = binding.etAiPrompt.text.toString().trim()
            if (prompt.isNotEmpty()) {
                viewModel.parseAiPrompt(prompt)
            } else {
                Toast.makeText(this, "Enter a description first", Toast.LENGTH_SHORT).show()
            }
        }

        // Units counter
        binding.btnPlusUnits.setOnClickListener {
            unitsCount++
            binding.tvUnits.text = unitsCount.toString()
        }

        binding.btnMinusUnits.setOnClickListener {
            if (unitsCount > 1) {
                unitsCount--
                binding.tvUnits.text = unitsCount.toString()
            }
        }

        // Radius Slider
        binding.sliderRadius.addOnChangeListener { _, value, _ ->
            binding.tvRadiusLabel.text = "Broadcast Alert Radius: ${value.toInt()} km"
        }

        // Submit Button
        binding.btnSendAlert.setOnClickListener {
            val patientName = binding.etPatientName.text.toString().trim()
            val hospitalName = binding.actHospital.text.toString().trim()
            val pickupAddress = binding.etPickupAddress.text.toString().trim()

            if (patientName.isEmpty() || hospitalName.isEmpty()) {
                Toast.makeText(this, "Please enter Patient Name and Destination Hospital", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val bloodGroup = when (binding.chipGroupBlood.checkedChipId) {
                R.id.chip_a_pos -> "A+"
                R.id.chip_a_neg -> "A-"
                R.id.chip_b_pos -> "B+"
                R.id.chip_b_neg -> "B-"
                R.id.chip_ab_pos -> "AB+"
                R.id.chip_ab_neg -> "AB-"
                R.id.chip_o_neg -> "O-"
                else -> "O+"
            }

            val urgency = when (binding.radioGroupUrgency.checkedRadioButtonId) {
                R.id.radio_moderate -> "moderate"
                R.id.radio_routine -> "routine"
                else -> "critical"
            }

            val request = BloodRequest(
                patientName = patientName,
                hospitalName = hospitalName,
                receiverAddress = pickupAddress,
                bloodGroup = bloodGroup,
                unitsNeeded = unitsCount,
                urgency = urgency,
                alertRadiusKm = binding.sliderRadius.value.toInt(),
                smsEnabled = binding.switchSmsMode.isChecked
            )

            viewModel.submitRequest(request)
        }
    }

    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.btnSendAlert.isEnabled = !isLoading
        }

        viewModel.parsedForm.observe(this) { form ->
            form.patientName?.let { binding.etPatientName.setText(it) }
            form.hospitalName?.let { binding.actHospital.setText(it) }
            unitsCount = form.units
            binding.tvUnits.text = unitsCount.toString()
            Toast.makeText(this, "Form autofilled with Grok AI ✨", Toast.LENGTH_SHORT).show()
        }

        viewModel.createdRequestId.observe(this) { reqId ->
            if (reqId != null) {
                val intent = Intent(this, RequestTrackingActivity::class.java).apply {
                    putExtra("REQUEST_ID", reqId)
                    putExtra("HOSPITAL_NAME", binding.actHospital.text.toString())
                    putExtra("PATIENT_NAME", binding.etPatientName.text.toString())
                    putExtra("UNITS", unitsCount)
                }
                startActivity(intent)
                finish()
            }
        }
    }
}
