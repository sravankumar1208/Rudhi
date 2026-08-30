package com.rudhi.app.ui.donor

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import com.rudhi.app.databinding.ActivityDonorNavigationBinding
import com.rudhi.app.ui.donation.LogDonationActivity

class DonorNavigationActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var binding: ActivityDonorNavigationBinding
    private var googleMap: GoogleMap? = null
    private var hospitalName = "Stanley Medical College"
    private var requestId = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDonorNavigationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        requestId = intent.getStringExtra("REQUEST_ID") ?: ""
        hospitalName = intent.getStringExtra("HOSPITAL_NAME") ?: "Stanley Medical College"

        binding.tvNavTitle.text = "Navigating to $hospitalName"
        binding.tvMissionHospital.text = hospitalName

        binding.mapView.onCreate(savedInstanceState)
        binding.mapView.getMapAsync(this)

        binding.btnOpenExternalMaps.setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${Uri.encode(hospitalName)}"))
            startActivity(intent)
        }

        binding.btnIveArrived.setOnClickListener {
            val logIntent = Intent(this, LogDonationActivity::class.java).apply {
                putExtra("REQUEST_ID", requestId)
                putExtra("HOSPITAL_NAME", hospitalName)
            }
            startActivity(logIntent)
            finish()
        }
    }

    override fun onMapReady(map: GoogleMap) {
        googleMap = map
        val destination = LatLng(13.1077, 80.2872) // Stanley Hospital Chennai
        googleMap?.addMarker(MarkerOptions().position(destination).title(hospitalName))
        googleMap?.moveCamera(CameraUpdateFactory.newLatLngZoom(destination, 15f))
    }

    override fun onResume() {
        super.onResume()
        binding.mapView.onResume()
    }

    override fun onPause() {
        super.onPause()
        binding.mapView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        binding.mapView.onDestroy()
    }

    override fun onLowMemory() {
        super.onLowMemory()
        binding.mapView.onLowMemory()
    }
}
