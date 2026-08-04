import { Card, Divider, Typography } from "@mui/material";

const FormSection = ({ title, children, sx }) => {
  return (
    <Card variant="outlined" sx={{ p: 3, mb: 3, ...sx }}>
      {title && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>
            {title}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </>
      )}
      {children}
    </Card>
  );
};

export default FormSection;
