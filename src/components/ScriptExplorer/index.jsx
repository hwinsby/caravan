import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

// Components
import { Grid, Box, Card, CardContent, Typography } from "@mui/material";
import NetworkPicker from "../NetworkPicker";
import ClientPicker from "../ClientPicker";
import AddressTypePicker from "../AddressTypePicker";
import ScriptEntry from "./ScriptEntry";
import UTXOSet from "./UTXOSet";
import OutputsForm from "./OutputsForm";
import SignatureImporter from "./SignatureImporter";
import Transaction from "./Transaction";
import ConfirmOwnership from "./ConfirmOwnership";
import UnsignedTransaction from "../UnsignedTransaction";
import "../styles.css";

const Spend = ({ transaction, ownership, signatureImporters }) => {
  const renderSignatureImporters = () => {
    const signatureImp = [];
    for (
      let signatureImporterNum = 1;
      signatureImporterNum <= transaction.requiredSigners;
      signatureImporterNum += 1
    ) {
      signatureImp.push(
        <Box key={signatureImporterNum} mt={2}>
          <SignatureImporter number={signatureImporterNum} />
        </Box>
      );
    }
    return signatureImp;
  };

  const spendable = () => {
    return transaction.inputs.length > 0;
  };

  const signaturesFinalized = () => {
    return (
      Object.values(signatureImporters).length > 0 &&
      Object.values(signatureImporters).every(
        (signatureImporter) => signatureImporter.finalized
      )
    );
  };

  // const confirmOwnership = (value) => {
  //   // TODO can this entire function be removed? The states aren't being used.
  //   // eslint-disable-next-line react/no-unused-state
  //   this.setState({ addressFinalized: true, confirmOwnership: value });
  // };

  // @winsby: the author of the above comment has a point.
  // Not only are the states not being use, but there is also no constructor, so the states are not being initialized.
  // Additionally, the function is not being called anywhere.

  const renderBody = () => {
    if (ownership.chosen) {
      return (
        <Box mt={2}>
          <ConfirmOwnership />
        </Box>
      );
    }
    return (
      <Box>
        {spendable() && (
          <Box>
            <Box mt={2}>
              <Card>
                <CardContent>
                  <UTXOSet
                    inputs={transaction.inputs}
                    inputsTotalSats={transaction.inputsTotalSats}
                  />
                </CardContent>
              </Card>
            </Box>
            <Box mt={2}>
              <Card>
                <CardContent>
                  <Typography variant="h5">Define Outputs</Typography>
                  <OutputsForm />
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {transaction.finalizedOutputs && (
          <div>
            <Box mt={2}>
              <UnsignedTransaction />
            </Box>

            <Box mt={2}>{renderSignatureImporters()}</Box>
          </div>
        )}

        {signaturesFinalized() && (
          <Box mt={2}>
            <Transaction />
          </Box>
        )}
      </Box>
    );
  };
  return (
    <Box mt={2}>
      <Grid container spacing={3}>
        <Grid item md={8}>
          <Box>
            <ScriptEntry />
          </Box>
          {renderBody()}
        </Grid>
        <Grid item md={4}>
          <Box>
            <AddressTypePicker />
          </Box>
          <Box mt={2}>
            <NetworkPicker />
          </Box>
          <Box mt={2}>
            <ClientPicker />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

Spend.propTypes = {
  transaction: PropTypes.shape({
    finalizedOutputs: PropTypes.bool,
    inputs: PropTypes.arrayOf(PropTypes.shape({})),
    inputsTotalSats: PropTypes.shape({}),
    requiredSigners: PropTypes.number,
  }).isRequired,
  ownership: PropTypes.shape({
    chosen: PropTypes.bool,
  }).isRequired,
  signatureImporters: PropTypes.shape({}).isRequired,
};

function mapStateToProps(state) {
  return state.spend;
}

export default connect(mapStateToProps)(Spend);
