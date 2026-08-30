package com.rudhi.app.ui.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.rudhi.app.R
import com.rudhi.app.data.model.BloodRequest
import com.rudhi.app.databinding.ItemRequestCardBinding

class RequestAdapter(
    private var requests: List<BloodRequest>,
    private val onAcceptClick: (BloodRequest) -> Unit,
    private val onViewClick: (BloodRequest) -> Unit
) : RecyclerView.Adapter<RequestAdapter.ViewHolder>() {

    class ViewHolder(val binding: ItemRequestCardBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemRequestCardBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val req = requests[position]
        with(holder.binding) {
            tvBloodGroup.text = req.bloodGroup
            tvHospitalName.text = req.hospitalName
            tvPatientAndDistance.text = "Patient: ${req.patientName}"
            tvUnitsNeeded.text = "${req.unitsNeeded} Unit${if (req.unitsNeeded > 1) "s" else ""} Required"
            tvUrgencyBadge.text = req.urgency.uppercase()
            tvTimePosted.text = req.createdAt ?: "Recently"

            if (req.urgency.lowercase() == "critical") {
                tvUrgencyBadge.setBackgroundResource(R.drawable.bg_badge_critical)
            } else {
                tvUrgencyBadge.setBackgroundResource(R.drawable.bg_badge_moderate)
            }

            btnAccept.setOnClickListener { onAcceptClick(req) }
            btnView.setOnClickListener { onViewClick(req) }
        }
    }

    override fun getItemCount(): Int = requests.size

    fun updateData(newRequests: List<BloodRequest>) {
        requests = newRequests
        notifyDataSetChanged()
    }
}
