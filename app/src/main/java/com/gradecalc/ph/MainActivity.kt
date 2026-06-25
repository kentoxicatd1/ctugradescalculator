package com.gradecalc.ph

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.gradecalc.ph.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding : ActivityMainBinding
    private val viewModel        : GradeViewModel by viewModels()
    private lateinit var adapter : GradeAdapter

    // ── File picker ──────────────────────────────────────────────────────────
    private val pickPdf = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode != RESULT_OK) return@registerForActivityResult
        val uri = result.data?.data ?: return@registerForActivityResult

        // Persist read permission across reboots
        contentResolver.takePersistableUriPermission(
            uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
        )
        binding.tvFileName.text = resolveFileName(uri)
        viewModel.parsePdf(uri)
    }

    // ── Storage permission (API < 33 only) ───────────────────────────────────
    private val requestPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) launchFilePicker()
        else snack("Storage permission is required to read PDF files.")
    }

    // ────────────────────────────────────────────────────────────────────────
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupClickListeners()
        observeViewModel()
    }

    private fun setupRecyclerView() {
        adapter = GradeAdapter()
        binding.rvGrades.layoutManager = LinearLayoutManager(this)
        binding.rvGrades.adapter       = adapter
        binding.rvGrades.setHasFixedSize(false)
    }

    private fun setupClickListeners() {
        binding.btnUpload.setOnClickListener      { checkPermissionAndPick() }
        binding.btnClear.setOnClickListener       { viewModel.clear() }
        binding.btnRecalculate.setOnClickListener { viewModel.recalculate() }
        binding.btnFaq.setOnClickListener         { showFaqDialog() }
    }

    private fun showFaqDialog() {
        val message = "Latin Honor Required GWA\n" +
                "• Summa Cum Laude: 1.000 – 1.200\n" +
                "• Magna Cum Laude: 1.201 – 1.450\n" +
                "• Cum Laude: 1.451 – 1.750\n\n" +
                "Additional Qualifications:\n" +
                "• Complete all graduation requirements.\n" +
                "• Complete at least 75% of the total academic units in residence at CTU.\n" +
                "• Have NO final grade lower than 2.50 in any subject.\n\n" +
                "Note: NSTP and PE subjects are NOT included in the GWA calculation."

        MaterialAlertDialogBuilder(this)
            .setTitle("Latin Honors Qualifications")
            .setMessage(message)
            .setPositiveButton("Got it", null)
            .show()
    }

    private fun observeViewModel() {
        viewModel.state.observe(this) { state ->
            when (state) {
                is GpaState.Idle    -> showIdle()
                is GpaState.Loading -> showLoading()
                is GpaState.Success -> showSuccess(state)
                is GpaState.Error   -> showError(state.message)
            }
        }
    }

    // ── State renderers ──────────────────────────────────────────────────────
    private fun showIdle() {
        binding.progressBar.visibility      = View.GONE
        binding.cardGpaResult.visibility    = View.GONE
        binding.cardGradesTable.visibility  = View.GONE
        binding.layoutActions.visibility    = View.GONE
        binding.tvStatusMessage.visibility  = View.GONE
        binding.tvFileName.text             = getString(R.string.no_pdf_selected)
    }

    private fun showLoading() {
        binding.progressBar.visibility      = View.VISIBLE
        binding.cardGpaResult.visibility    = View.GONE
        binding.cardGradesTable.visibility  = View.GONE
        binding.layoutActions.visibility    = View.GONE
        binding.tvStatusMessage.visibility  = View.GONE
    }

    private fun showSuccess(state: GpaState.Success) {
        binding.progressBar.visibility      = View.GONE
        binding.tvStatusMessage.visibility  = View.GONE
        binding.cardGpaResult.visibility    = View.VISIBLE
        binding.cardGradesTable.visibility  = View.VISIBLE
        binding.layoutActions.visibility    = View.VISIBLE

        val academicEntries = state.entries.filter { !it.isNonAcademic }

        // GPA summary card
        binding.tvGpaValue.text    = String.format("%.2f", state.gpa)
        binding.tvGpaRemark.text   = state.remark
        binding.tvTotalUnits.text  = academicEntries
            .filter { !it.isIncomplete }.sumOf { it.units }.toInt().toString()
        binding.tvSubjectCount.text = academicEntries.size.toString()
        binding.tvPassFail.text    = if (state.gpa in 1.0..3.0) "Passed" else "Failed"

        // Grade table
        adapter.update(academicEntries)
    }

    private fun showError(message: String) {
        binding.progressBar.visibility      = View.GONE
        binding.cardGpaResult.visibility    = View.GONE
        binding.cardGradesTable.visibility  = View.GONE
        binding.layoutActions.visibility    = View.GONE
        binding.tvStatusMessage.text        = message
        binding.tvStatusMessage.visibility  = View.VISIBLE
    }

    // ── File picking helpers ─────────────────────────────────────────────────
    private fun checkPermissionAndPick() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // On API 33+ the system picker doesn't need a runtime permission
            launchFilePicker()
        } else {
            val perm = Manifest.permission.READ_EXTERNAL_STORAGE
            if (ContextCompat.checkSelfPermission(this, perm) == PackageManager.PERMISSION_GRANTED) {
                launchFilePicker()
            } else {
                requestPermission.launch(perm)
            }
        }
    }

    private fun launchFilePicker() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "application/pdf"
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or
                     Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }
        pickPdf.launch(intent)
    }

    private fun resolveFileName(uri: Uri): String {
        var name = "Selected PDF"
        contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val col = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (col >= 0) name = cursor.getString(col)
            }
        }
        return name
    }

    private fun snack(msg: String) =
        Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
}
