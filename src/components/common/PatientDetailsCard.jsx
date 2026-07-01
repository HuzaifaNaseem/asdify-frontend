import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say']
const RELATIONSHIP_OPTIONS = ['Parent', 'Guardian', 'Caregiver', 'Clinician', 'Other']

/**
 * Collects basic patient details for inclusion in the PDF report.
 *
 * Props:
 *   value   – { childName, childDob, childAge, childGender, caregiverName, relationship }
 *   onChange – called with the merged next value
 *   onContinue – called when user clicks "Continue"
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
  function set(field) {
    return (e) => onChange({ ...value, [field]: e.target.value })
  }

  return (
    <div className="ui-card patient-details-card">
      <div className="patient-details-card__header">
        <span className="patient-details-card__badge">{stepBadge}</span>
        <h2 className="patient-details-card__title">Patient Details</h2>
        <p className="patient-details-card__lead muted">
          These details appear on the generated PDF report. All fields are optional — you can
          skip and continue directly to the assessment.
        </p>
      </div>

      <div className="patient-details-card__grid">
        <Input
          label="Child's full name"
          name="childName"
          type="text"
          placeholder="e.g. Alex Johnson"
          value={value.childName ?? ''}
          onChange={set('childName')}
          hint="Used in the report header."
        />

        <Input
          label="Child's date of birth"
          name="childDob"
          type="date"
          value={value.childDob ?? ''}
          onChange={set('childDob')}
          hint="Optional — appears as 'Age / DOB' on the report."
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
          <span className="ui-label">Child's gender</span>
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
        </label>

        <Input
          label="Caregiver / parent name"
          name="caregiverName"
          type="text"
          placeholder="e.g. Jane Johnson"
          value={value.caregiverName ?? ''}
          onChange={set('caregiverName')}
        />

        <label className="ui-field">
          <span className="ui-label">Relationship to child</span>
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
        </label>
      </div>

      <div className="screening-actions patient-details-card__actions">
        <Button onClick={onContinue}>{continueLabel}</Button>
      </div>
    </div>
  )
}
