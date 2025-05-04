import { AppBar, Toolbar, Typography } from "@mui/material";

const Header = () => {
  return (
    <AppBar>
      <Toolbar>
        <Typography variant="h5">Patient Manager</Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
