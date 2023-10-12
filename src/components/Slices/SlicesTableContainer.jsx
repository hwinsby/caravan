import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
} from "@mui/material";
import {
  getSlicesWithBalance,
  getZeroBalanceSlices,
  getSpentSlices,
} from "../../selectors/wallet";
import { slicePropTypes, clientPropTypes } from "../../proptypes";

// Components
import SlicesTable from "./SlicesTable";

const SlicesTableContainer = ({
  client,
  network,
  slicesWithBalance,
  zeroBalanceSlices,
  spentSlices,
}) => {
  const [filterIncludeSpent, setFilterIncludeSpent] = useState(false);
  const [filterIncludeZeroBalance, setFilterIncludeZeroBalance] =
    useState(false);
  const [displaySlices, setDisplaySlices] = useState(
    slicesWithBalance.length ? [...slicesWithBalance] : []
  );

  useEffect(() => {
    const newDisplaySlices = [...slicesWithBalance];
    if (filterIncludeSpent) {
      newDisplaySlices.push(...spentSlices);
    }
    if (filterIncludeZeroBalance) {
      newDisplaySlices.push(...zeroBalanceSlices);
    }
    setDisplaySlices(newDisplaySlices);
  }, [slicesWithBalance.length, filterIncludeSpent, filterIncludeZeroBalance]);

  const filterAddresses = (event) => {
    const { value, checked } = event.target;
    if (value === "filterIncludeSpent") {
      setFilterIncludeSpent(checked);
    }
    if (value === "filterIncludeZeroBalance") {
      setFilterIncludeZeroBalance(checked);
    }
  };

  return (
    <Card>
      <CardContent>
        <Grid container direction="column">
          <Grid item>
            <SlicesTable
              slices={displaySlices}
              client={client}
              network={network}
              paging
            />
          </Grid>
          <Grid item>
            <FormGroup row>
              <FormLabel component="h2">
                <Box mr={3}>Show Additional</Box>
              </FormLabel>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterIncludeSpent}
                    value="filterIncludeSpent"
                    onChange={filterAddresses}
                  />
                }
                label="Spent Addresses"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterIncludeZeroBalance}
                    value="filterIncludeZeroBalance"
                    onChange={filterAddresses}
                  />
                }
                label="Zero Balance"
              />
            </FormGroup>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

SlicesTableContainer.propTypes = {
  slicesWithBalance: PropTypes.arrayOf(PropTypes.shape(slicePropTypes))
    .isRequired,
  zeroBalanceSlices: PropTypes.arrayOf(PropTypes.shape(slicePropTypes))
    .isRequired,
  spentSlices: PropTypes.arrayOf(PropTypes.shape(slicePropTypes)).isRequired,
  client: PropTypes.shape(clientPropTypes).isRequired,
  network: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {
    slicesWithBalance: getSlicesWithBalance(state),
    zeroBalanceSlices: getZeroBalanceSlices(state),
    spentSlices: getSpentSlices(state),
    walletMode: state.wallet.common.walletMode,
    client: state.client,
    network: state.settings.network,
  };
}

export default connect(mapStateToProps)(SlicesTableContainer);
