package com.rudhi.app.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.rudhi.app.data.model.Hospital
import com.rudhi.app.databinding.ItemHospitalCardBinding

class HospitalAdapter(
    private var hospitals: List<Hospital>,
    private val onCallClick: (Hospital) -> Unit,
    private val onNavigateClick: (Hospital) -> Unit
) : RecyclerView.Adapter<HospitalAdapter.ViewHolder>() {

    class ViewHolder(val binding: ItemHospitalCardBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemHospitalCardBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val hosp = hospitals[position]
        with(holder.binding) {
            tvHospitalName.text = hosp.name
            tvHospitalType.text = hosp.type
            tvHospitalAddress.text = hosp.address
            tvDistance.text = "${hosp.distanceKm} km"

            btnCall.setOnClickListener { onCallClick(hosp) }
            btnNavigate.setOnClickListener { onNavigateClick(hosp) }
        }
    }

    override fun getItemCount(): Int = hospitals.size

    fun updateData(newHospitals: List<Hospital>) {
        hospitals = newHospitals
        notifyDataSetChanged()
    }
}
