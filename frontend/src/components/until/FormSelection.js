import { Autocomplete, TextField } from "@mui/material";

const FormSelection = (props) => {
  return (
    <Autocomplete
      value={props.value || null}
      disablePortal
      isOptionEqualToValue={(option, value) => {
        if (!value) return false;
        if (typeof value === "object") return option.id === value.id;
        return option.id === value || option === value;
      }}
      getOptionLabel={(option) => {
        if (typeof option === "string") return option;
        return option.label || option.name || "";
      }}
      sx={{
        "& .MuiInputBase-root": {
          height: "2rem",
          borderRadius: "0.3rem",
          padding: 0,
          paddingLeft: "5px",
        },
        "& .MuiAutocomplete-endAdornment": {
          top: "50%",
          transform: "translate(0, -50%)",
        },
      }}
      options={props.options}
      onChange={props.optionSelected}
      disabled={props.disabled}
      renderInput={(params) => (
        <TextField {...params} required={props.required} />
      )}
    />
  );
};

export default FormSelection;
