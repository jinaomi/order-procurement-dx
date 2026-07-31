import FormInput from "./FormInput";
import FormSelection from "./FormSelection";

function GenericItems({ label, type, options, children, ...props }) {
  switch (type) {
    case "string":
      return (
        <FormInput
          label={label}
          className="section-input"
          type="text"
          onChange={props.handleInput}
          value={props.value}
          isRequired={props.required}
          maxLength={props.maxLength || undefined}
        >
          {children}
        </FormInput>
      );
    case "list":
      return (
        <div className="section-item">
          <label className="section-label">
            {label}
            {props.required ? <span className="required-icon"> *</span> : null}
          </label>
          <FormSelection
            options={options}
            optionSelected={props.handleInput3}
            value={props.value}
            isRequired={props.required}
          />
          {children}
        </div>
      );
    case "customerlist":
      return (
        <div className="section-item">
          <label className="section-label">
            {label}
            {props.required ? <span className="required-icon"> *</span> : null}
          </label>
          <FormSelection
            options={props.optionCustomers}
            optionSelected={props.handleInputCustomer}
            value={props.value}
            isRequired={props.required}
          />
          {children}
        </div>
      );
    case "daterange":
      return (
        <div className="section-item">
          <label className="section-label">{label}</label>
          <div className="section-range" style={{ marginBottom: 10 }}>
            <input
              value={props.value1}
              type="date"
              onChange={props.handleInput1}
              className="section-input"
            ></input>
            <span>〜</span>
            <input
              value={props.value2}
              type="date"
              onChange={props.handleInput2}
              className="section-input"
              min={props.value1}
            ></input>
          </div>
        </div>
      );
    case "textarea":
      return (
        <FormInput
          label={label}
          className="section-input"
          type="textarea"
          onChange={props.handleInput}
          value={props.value}
          isRequired={props.required}
          maxLength={props.maxLength || undefined}
        >
          {children}
        </FormInput>
      );
    case "datetime":
      return (
        <FormInput
          label={label}
          className="section-input"
          type="date"
          onChange={props.handleInput}
          value={props.value}
          isRequired={props.required}
        >
          {children}
        </FormInput>
      );
    case "decimal":
      return (
        <FormInput
          label={label}
          className="section-input"
          type="number"
          onChange={props.handleInput}
          value={props.value}
          isRequired={props.required}
          onFocus={(e) =>
            e.target.addEventListener(
              "wheel",
              function (e) {
                e.preventDefault();
              },
              { passive: false }
            )
          }
        >
          {children}
        </FormInput>
      );
    case "decimalrange":
      return (
        <div className="section-item">
          <label className="section-label">{label}</label>
          <div className="section-range" style={{ marginBottom: 10 }}>
            <input
              value={props.value1}
              type="number"
              onChange={props.handleInput1}
              className="section-input"
              onFocus={(e) =>
                e.target.addEventListener(
                  "wheel",
                  function (e) {
                    e.preventDefault();
                  },
                  { passive: false }
                )
              }
            />
            <span>〜</span>
            <input
              value={props.value2}
              type="number"
              onChange={props.handleInput2}
              className="section-input"
              onFocus={(e) =>
                e.target.addEventListener(
                  "wheel",
                  function (e) {
                    e.preventDefault();
                  },
                  { passive: false }
                )
              }
            />
          </div>
        </div>
      );
    case "int":
      return (
        <FormInput
          label={label}
          className="section-input"
          type="number"
          onChange={props.handleInput}
          value={props.value}
          isRequired={props.required}
          onFocus={(e) =>
            e.target.addEventListener(
              "wheel",
              function (e) {
                e.preventDefault();
              },
              { passive: false }
            )
          }
        >
          {children}
        </FormInput>
      );
    default:
      return <></>;
  }
}

export default GenericItems;
