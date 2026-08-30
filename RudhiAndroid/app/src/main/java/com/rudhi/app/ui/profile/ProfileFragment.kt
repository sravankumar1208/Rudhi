package com.rudhi.app.ui.profile

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.rudhi.app.databinding.BottomSheetEditProfileBinding
import com.rudhi.app.databinding.FragmentProfileBinding
import com.rudhi.app.ui.settings.SettingsActivity

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!
    private val viewModel: ProfileViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnEditProfile.setOnClickListener {
            showEditProfileBottomSheet()
        }

        binding.btnMyCertificates.setOnClickListener {
            startActivity(Intent(requireContext(), MyDonationsActivity::class.java))
        }

        binding.btnMyRequests.setOnClickListener {
            startActivity(Intent(requireContext(), MyRequestsActivity::class.java))
        }

        binding.btnSettings.setOnClickListener {
            startActivity(Intent(requireContext(), SettingsActivity::class.java))
        }

        viewModel.userProfile.observe(viewLifecycleOwner) { profile ->
            if (profile != null) {
                binding.tvProfileName.text = profile.fullName ?: "User"
                binding.tvProfileInitial.text = profile.fullName?.firstOrNull()?.uppercase() ?: "U"
                binding.tvProfileBloodGroup.text = "Blood Group: ${profile.bloodGroup ?: "O+"}"
                binding.tvProfileEmail.text = "Email: ${profile.email ?: "Not set"}"
                binding.tvProfilePhone.text = "Phone: ${profile.phone ?: "+91 98765 43210"}"
                binding.tvProfileAddress.text = "Address: ${profile.address ?: "Chennai, Tamil Nadu"}"

                val count = profile.donationCount ?: 3
                binding.tvDonationsCount.text = count.toString()
                binding.tvTierStatus.text = when {
                    count >= 5 -> "Gold Tier"
                    count >= 3 -> "Silver Tier"
                    else -> "Bronze Tier"
                }
            }
        }

        viewModel.loadProfile()
    }

    private fun showEditProfileBottomSheet() {
        val dialog = BottomSheetDialog(requireContext())
        val sheetBinding = BottomSheetEditProfileBinding.inflate(layoutInflater)
        dialog.setContentView(sheetBinding.root)

        val profile = viewModel.userProfile.value
        sheetBinding.etEditName.setText(profile?.fullName ?: "")
        sheetBinding.etEditPhone.setText(profile?.phone ?: "")
        sheetBinding.etEditAddress.setText(profile?.address ?: "")

        sheetBinding.btnSaveProfile.setOnClickListener {
            val name = sheetBinding.etEditName.text.toString().trim()
            val phone = sheetBinding.etEditPhone.text.toString().trim()
            val address = sheetBinding.etEditAddress.text.toString().trim()

            if (name.isNotEmpty()) {
                viewModel.updateProfile(name, phone, address)
                Toast.makeText(requireContext(), "Profile updated!", Toast.LENGTH_SHORT).show()
                dialog.dismiss()
            }
        }

        dialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
