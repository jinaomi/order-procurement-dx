import { Button, Tooltip } from "@mui/material";

const FormButton = ({ itemName, buttonType = "normal", ...props }) => {
  var color, variant;

  switch (buttonType) {
    case "delete":
      color = "error";
      variant = "contained";
      break;
    case "attach":
      color = "secondary";
      variant = "outlined";
      break;
    case "secondaryAction":
      // Hành động phụ (vd 新規作成) — vẫn thuộc primary nhưng nhẹ hơn "保存" để phân cấp thị giác
      color = "primary";
      variant = "outlined";
      break;
    case "cancel":
      color = "inherit";
      variant = "text";
      break;
    default:
      color = "primary";
      variant = "contained";
      break;
  }

  return (
    <Tooltip title={props.titleContent} placement="top">
      <span className="tooltipSpan">
        <Button color={color} variant={variant} sx={{ width: "100%" }} {...props}>
          {itemName}
        </Button>
      </span>
    </Tooltip>
  );
};

export default FormButton;
