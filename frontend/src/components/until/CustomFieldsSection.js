import { Grid, Divider, Chip } from "@mui/material";
import GenericItems from "./GenericItems";

const CustomFieldsSection = ({ fields, values, onChange, title = "カスタム項目" }) => {
  if (!fields || fields.length === 0) {
    return null;
  }

  const getValue = (keywordId) => {
    const found = values.find((v) => v.keywordId === keywordId);
    return found ? found.value || "" : "";
  };

  const setValue = (keywordId, newValue) => {
    onChange((prev) => {
      const exists = prev.some((v) => v.keywordId === keywordId);
      if (exists) {
        return prev.map((v) =>
          v.keywordId === keywordId ? { ...v, value: newValue } : v
        );
      }
      return [...prev, { keywordId, value: newValue }];
    });
  };

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  return (
    <Grid item xs={12}>
      <Divider sx={{ my: 2 }}>
        <Chip label={title} size="small" variant="outlined" />
      </Divider>
      <Grid container columnSpacing={5} rowSpacing={3}>
        {sortedFields.map((field) => (
          <Grid
            item
            xs={12}
            sm={field.typeValue === "textarea" ? 12 : 6}
            key={field.keywordId}
          >
            <GenericItems
              label={field.keywordName}
              type={field.typeValue}
              options={field.metadata}
              required={field.isRequired}
              maxLength={field.maxLength}
              value={getValue(field.keywordId)}
              handleInput={(e) => setValue(field.keywordId, e.target.value)}
              handleInput3={(e, selected) =>
                setValue(field.keywordId, selected || "")
              }
            />
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default CustomFieldsSection;
