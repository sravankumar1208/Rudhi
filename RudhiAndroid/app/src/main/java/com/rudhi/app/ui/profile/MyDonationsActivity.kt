package com.rudhi.app.ui.profile

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.rudhi.app.data.repository.DonationRepository
import com.rudhi.app.databinding.ActivityMyDonationsBinding
import com.rudhi.app.ui.adapters.DonationAdapter
import com.rudhi.app.ui.certificate.CertificateActivity
import kotlinx.coroutines.launch

class MyDonationsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMyDonationsBinding
    private val donationRepo = DonationRepository()
    private lateinit var adapter: DonationAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMyDonationsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        adapter = DonationAdapter(emptyList()) { donation ->
            val intent = Intent(this, CertificateActivity::class.java).apply {
                putExtra("DONATION_ID", donation.id)
                putExtra("HOSPITAL_NAME", donation.hospitalName)
                putExtra("DATE", donation.donatedAt)
            }
            startActivity(intent)
        }

        binding.rvDonations.layoutManager = LinearLayoutManager(this)
        binding.rvDonations.adapter = adapter

        lifecycleScope.launch {
            val list = donationRepo.getMyDonations()
            if (list.isEmpty()) {
                binding.tvEmptyDonations.visibility = View.VISIBLE
                binding.rvDonations.visibility = View.GONE
            } else {
                binding.tvEmptyDonations.visibility = View.GONE
                binding.rvDonations.visibility = View.VISIBLE
                adapter.updateData(list)
            }
        }
    }
}
