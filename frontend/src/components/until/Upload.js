import { TextField } from "@mui/material";
import FormButton from "./FormButton";
import FormSelection from "./FormSelection";
import FormInput from "./FormInput";

const Upload = (props) => {
  return (
    <form onSubmit={props.uploadFunction}>
      <div className="section-item">
        <label className="section-label">書類種類</label>
        <FormSelection
          options={props.optionFileType}
          optionSelected={props.handleSelectedFileType}
          value={props.valueFileType}
          disabled={props.disableFileType}
        />
      </div>
      <label className="section-label">書類名</label>
      <FormInput
        itemName="File Name"
        className="section-input"
        type="text"
        onChange={props.handleInputFileName}
        value={props.valueFileName}
      />
      <TextField type="file" onChange={props.handleFileChange} />
      <br />
      <FormButton itemName="添付" buttonType="attach" type="submit" />
    </form>
  );
};

export default Upload;
