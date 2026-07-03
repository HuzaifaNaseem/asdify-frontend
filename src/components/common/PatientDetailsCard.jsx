import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']
const RELATIONSHIP_OPTIONS = ['Parent', 'Guardian', 'Caregiver', 'Clinician', 'Other']

function validate(value) {
  const e = {}
  if (!value.childName?.trim()) e.childName = 'Child’s name is required.'
  if (!value.childDob && !value.childAge?.trim()) {
    e.childDob = 'Enter a date of birth (or an age below).'
  }
  if (!value.childGender) e.childGender = 'Please select a gender.'
  if (!value.caregiverName?.trim()) e.caregiverName = 'Caregiver name is required.'
  if (!value.relationship) e.relationship = 'Please select a relationship.'
  return e
}

/**
 * Collects required patient details for inclusion in the PDF report.
 *
 * Props:
 *   value   – { childName, childDob, childAge, childGender, caregiverName, relationship }
 *   onChange – called with the merged next value
 *   onContinue – called when the details validate and the user continues
 *   continueLabel – optional override for the button text
 *   stepBadge – optional badge text (default "Step 1 of 2")
 */
export function PatientDetailsCard({
  value,
  onChange,
  onContinue,
  continueLabel = 'Continue to Assessment',
  stepBadge = 'Step 1 of 2',
}) {
  const [errors, setErrors] = useState({})

  function set(field) {
    return (e) => {
      onChange({ ...value, [field]: e.target.value })
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleContinue() {
    const e = validate(value)
    setErrors(e)
    if (Object.keys(e).length === 0) onContinue()
  }

  return (
    <div className="ui-card patient-details-card">
      <div className="patient-details-card__header">
        <span className="patient-details-card__badge">{stepBadge}</span>
        <h2 className="patient-details-card__title">Patient Details</h2>
        <p className="patient-details-card__lead muted">
          These details appear on the generated PDF report and are required before continuing.
        </p>
      </div>

      <div className="patient-details-card__grid">
        <Input
          label="Child's full name *"
          name="childName"
          type="text"
          placeholder="e.g. Alex Johnson"
          value={value.childName ?? ''}
          onChange={set('childName')}
          hint="Used in the report header."
          error={errors.childName}
        />

        <Input
          label="Child's date of birth *"
          name="childDob"
          type="date"
          value={value.childDob ?? ''}
          onChange={set('childDob')}
          hint="Date of birth or age below is required."
          error={errors.childDob}
        />

        <Input
          label="Child's age (if DOB not provided)"
          name="childAge"
          type="text"
          placeholder="e.g. 3 years 4 months"
          value={value.childAge ?? ''}
          onChange={set('childAge')}
          hint="Written description of age."
        />

        <label className="ui-field">
          <span className="ui-label">Child's gender *</span>
          <select
            className="ui-input"
            value={value.childGender ?? ''}
            onChange={set('childGender')}
          >
            <option value="">— Select —</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {errors.childGender ? (
            <p className="ui-error" role="alert">{errors.childGender}</p>
          ) : null}
        </label>

        <Input
          label="Caregiver / parent name *"
          name="caregiverName"
          type="text"
          placeholder="e.g. Jane Johnson"
          value={value.caregiverName ?? ''}
          onChange={set('caregiverName')}
          error={errors.caregiverName}
        />

        <label className="ui-field">
          <span className="ui-label">Relationship to child *</span>
          <select
            className="ui-input"
            value={value.relationship ?? ''}
            onChange={set('relationship')}
          >
            <option value="">— Select —</option>
            {RELATIONSHIP_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {errors.relationship ? (
            <p className="ui-error" role="alert">{errors.relationship}</p>
          ) : null}
        </label>
      </div>

      <div className="screening-actions patient-details-card__actions">
        <Button onClick={handleContinue}>{continueLabel}</Button>
      </div>
    </div>
  )
}
