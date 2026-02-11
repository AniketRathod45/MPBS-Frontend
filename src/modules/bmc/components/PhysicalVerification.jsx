export default function PhysicalVerification({ value, onChange }) {
  return (
    <div className="mb-4">
      <p className="font-semibold mb-2">
        Do physical values match society entry?
      </p>

      <label className="mr-4">
        <input
          type="radio"
          checked={value === true}
          onChange={() => onChange(true)}
        /> Yes
      </label>

      <label>
        <input
          type="radio"
          checked={value === false}
          onChange={() => onChange(false)}
        /> No
      </label>
    </div>
  );
}
