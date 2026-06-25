package com.gradecalc.ph

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView

class GradeAdapter(
    private var entries: List<GradeEntry> = emptyList()
) : RecyclerView.Adapter<GradeAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvSubjectName : TextView = view.findViewById(R.id.tvSubjectName)
        val tvUnits       : TextView = view.findViewById(R.id.tvUnits)
        val tvRawGrade    : TextView = view.findViewById(R.id.tvRawGrade)
        val tvGradePoint  : TextView = view.findViewById(R.id.tvGradePoint)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_grade_row, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val e = entries[position]

        holder.tvSubjectName.text = e.subjectName
        holder.tvUnits.text       = "${e.units.toInt()} u"
        holder.tvRawGrade.text    = e.rawGrade

        if (e.isIncomplete) {
            holder.tvGradePoint.text      = "—"
            holder.tvGradePoint.setTextColor(Color.parseColor("#6B7280"))
        } else {
            holder.tvGradePoint.text = String.format("%.2f", e.gradePoint)
            holder.tvGradePoint.setTextColor(
                if (e.isPassed) Color.parseColor("#16A34A")
                else            Color.parseColor("#DC2626")
            )
        }
    }

    override fun getItemCount(): Int = entries.size

    fun update(newEntries: List<GradeEntry>) {
        val diff = DiffUtil.calculateDiff(object : DiffUtil.Callback() {
            override fun getOldListSize() = entries.size
            override fun getNewListSize() = newEntries.size
            override fun areItemsTheSame(o: Int, n: Int) =
                entries[o].subjectName == newEntries[n].subjectName
            override fun areContentsTheSame(o: Int, n: Int) =
                entries[o] == newEntries[n]
        })
        entries = newEntries
        diff.dispatchUpdatesTo(this)
    }
}
