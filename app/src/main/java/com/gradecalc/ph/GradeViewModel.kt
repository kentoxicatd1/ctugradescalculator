package com.gradecalc.ph

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

sealed class GpaState {
    object Idle    : GpaState()
    object Loading : GpaState()
    data class Success(
        val entries : List<GradeEntry>,
        val gpa     : Double,
        val remark  : String
    ) : GpaState()
    data class Error(val message: String) : GpaState()
}

class GradeViewModel(application: Application) : AndroidViewModel(application) {

    private val _state = MutableLiveData<GpaState>(GpaState.Idle)
    val state: LiveData<GpaState> = _state

    private var lastUri: Uri? = null

    fun parsePdf(uri: Uri) {
        lastUri = uri
        _state.value = GpaState.Loading

        viewModelScope.launch {
            try {
                val entries = withContext(Dispatchers.IO) {
                    GradeParser.parsePdf(getApplication(), uri)
                }
                if (entries.isEmpty()) {
                    _state.value = GpaState.Error(
                        "No grade rows were detected in this PDF.\n\n" +
                        "Make sure the file contains a standard grade table with " +
                        "subject codes, unit counts, and numeric grades."
                    )
                } else {
                    val gpa    = GradeParser.calculateGpa(entries)
                    val remark = GradeParser.getHonorsStatus(gpa, entries)
                    _state.value = GpaState.Success(entries, gpa, remark)
                }
            } catch (e: Exception) {
                _state.value = GpaState.Error(
                    "Could not read the PDF: ${e.localizedMessage ?: "Unknown error"}"
                )
            }
        }
    }

    fun recalculate() { lastUri?.let { parsePdf(it) } }

    fun clear() {
        lastUri = null
        _state.value = GpaState.Idle
    }
}
