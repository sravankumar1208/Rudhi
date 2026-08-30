package com.rudhi.app.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.rudhi.app.data.model.Donation
import com.rudhi.app.databinding.ItemDonationCardBinding

class DonationAdapter(
    private var donations: List<Donation>,
    private val onItemClick: (Donation) -> Unit
) : RecyclerView.Adapter<DonationAdapter.ViewHolder>() {

    class ViewHolder(val binding: ItemDonationCardBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemDonationCardBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val don = donations[position]
        with(holder.binding) {
            tvDonationHospital.text = don.hospitalName
            tvDonationUnits.text = "${don.unitsDonated} Unit${if (don.unitsDonated > 1) "s" else ""} Donated"
            tvDonationStatus.text = don.status.uppercase()

            root.setOnClickListener { onItemClick(don) }
        }
    }

    override fun getItemCount(): Int = donations.size

    fun updateData(newDonations: List<Donation>) {
        donations = newDonations
        notifyDataSetChanged()
    }
}
