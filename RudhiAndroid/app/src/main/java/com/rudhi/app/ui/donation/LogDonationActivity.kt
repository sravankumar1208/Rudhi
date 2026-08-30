package com.rudhi.app.ui.donation

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide
import com.rudhi.app.databinding.ActivityLogDonationBinding
import com.rudhi.app.ui.certificate.CertificateActivity

class LogDonationActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLogDonationBinding
    private val viewModel: LogDonationViewModel by viewModels()

    private var selectedImageUri: Uri? = null
    private var requestId: String? = null
    private var hospitalName: String = "Stanley Medical College"

    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            selectedImageUri = result.data?.data
            if (selectedImageUri != null) {
                binding.layoutUploadPrompt.visibility = View.GONE
                binding.ivProofPreview.visibility = View.VISIBLE
                Glide.with(this).load(selectedImageUri).into(binding.ivProofPreview)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLogDonationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        requestId = intent.getStringExtra("REQUEST_ID")
        hospitalName = intent.getStringExtra("HOSPITAL_NAME") ?: "Stanley Medical College"

        binding.cardPhotoUpload.setOnClickListener {
            val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
            imagePickerLauncher.launch(intent)
        }

        binding.btnConfirmDonation.setOnClickListener {
            val unitsText = binding.etUnitsDonated.text.toString().trim()
            val units = unitsText.toIntOrNull() ?: 1
            val feedback = binding.etFeedback.text.toString().trim()

            viewModel.confirmDonationWithProof(
                requestId = requestId,
                hospitalName = hospitalName,
                unitsDonated = units,
                proofUrlOrBase64 = selectedImageUri?.toString() ?: "https://rudhi.app/proof.jpg",
                feedback = feedback
            )
        }

        observeViewModel()
    }

    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.btnConfirmDonation.isEnabled = !isLoading
        }

        viewModel.verificationResult.observe(this) { result ->
            if (!result.isAuthorized) {
                AlertDialog.Builder(this)
                    .setTitle("AI Verification Rejection")
                    .setMessage(result.reason)
                    .setPositiveButton("OK", null)
                    .show()
            }
        }

        viewModel.createdDonation.observe(this) { donation ->
            if (donation != null) {
                Toast.makeText(this, "Donation verified and logged! 🎉", Toast.LENGTH_SHORT).show()
                val certIntent = Intent(this, CertificateActivity::class.java).apply {
                    putExtra("DONATION_ID", donation.id)
                    putExtra("HOSPITAL_NAME", donation.hospitalName)
                    putExtra("DATE", donation.donatedAt)
                }
                startActivity(certIntent)
                finish()
            }
        }
    }
}
