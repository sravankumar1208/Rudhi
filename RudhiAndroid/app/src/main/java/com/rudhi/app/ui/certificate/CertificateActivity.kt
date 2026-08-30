package com.rudhi.app.ui.certificate

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.rudhi.app.data.repository.AuthRepository
import com.rudhi.app.data.repository.DonationRepository
import com.rudhi.app.databinding.ActivityCertificateBinding
import kotlinx.coroutines.launch
import nl.dionsegijn.konfetti.core.Party
import nl.dionsegijn.konfetti.core.Position
import nl.dionsegijn.konfetti.core.emitter.Emitter
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

class CertificateActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCertificateBinding
    private val authRepo = AuthRepository()
    private val donationRepo = DonationRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCertificateBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val donationId = intent.getStringExtra("DONATION_ID") ?: "RUDHI-9482"
        val hospitalName = intent.getStringExtra("HOSPITAL_NAME") ?: "Stanley Medical College"
        val dateStr = intent.getStringExtra("DATE") ?: "Aug 29, 2026"

        binding.tvCertId.text = "Certificate ID: $donationId"
        binding.tvCertBody.text = "For donating blood at $hospitalName and saving a precious life."
        binding.tvCertDate.text = "Date: $dateStr"

        lifecycleScope.launch {
            val user = authRepo.getCurrentUserProfile()
            binding.tvCertDonorName.text = user?.fullName ?: "Valued Blood Donor"
        }

        triggerKonfetti()

        binding.btnShareCert.setOnClickListener {
            shareCertificateText()
        }

        binding.btnSavePdf.setOnClickListener {
            exportCertificateToPdf()
        }
    }

    private fun triggerKonfetti() {
        val party = Party(
            speed = 0f,
            maxSpeed = 30f,
            damping = 0.9f,
            spread = 360,
            colors = listOf(Color.parseColor("#C81E3D"), Color.parseColor("#E8A020"), Color.parseColor("#1A9E5C")),
            position = Position.Relative(0.5, 0.3),
            emitter = Emitter(duration = 100, TimeUnit.MILLISECONDS).max(100)
        )
        binding.konfettiView.start(party)
    }

    private fun shareCertificateText() {
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, "My Blood Donation Certificate - Rudhi")
            putExtra(
                Intent.EXTRA_TEXT,
                "I just donated blood using Rudhi! Verified by Grok AI. Save lives together!"
            )
        }
        startActivity(Intent.createChooser(shareIntent, "Share Certificate"))
    }

    private fun exportCertificateToPdf() {
        val view = binding.layoutCertificateCard
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        view.draw(canvas)

        val pdfDocument = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(view.width, view.height, 1).create()
        val page = pdfDocument.startPage(pageInfo)
        page.canvas.drawBitmap(bitmap, 0f, 0f, null)
        pdfDocument.finishPage(page)

        val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        val file = File(downloadsDir, "Rudhi_Donation_Certificate_${System.currentTimeMillis()}.pdf")

        try {
            pdfDocument.writeTo(FileOutputStream(file))
            pdfDocument.close()
            Toast.makeText(this, "Certificate saved to Downloads folder!", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, "Failed to export PDF", Toast.LENGTH_SHORT).show()
        }
    }
}
