import React, { createRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { validatePublicKey, validateBIP32Path } from "unchained-bitcoin";
import { TREZOR, LEDGER, HERMIT } from "unchained-wallets";

// Components
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import { styled } from "@mui/material/styles";
import {
  Card,
  CardHeader,
  CardContent,
  MenuItem,
  FormControl,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
} from "@mui/material";
import HardwareWalletPublicKeyImporter from "../CreateAddress/HardwareWalletPublicKeyImporter";
import HermitPublicKeyImporter from "../CreateAddress/HermitPublicKeyImporter";

// Actions
import {
  resetPublicKeyImporter,
  resetPublicKeyImporterBIP32Path,
  setPublicKeyImporterBIP32Path,
  setPublicKeyImporterMethod,
  setPublicKeyImporterPublicKey,
} from "../../actions/ownershipActions";

const ConfirmOwnership = ({
  publicKeyImporter,
  setMethod,
  reset,
  resetBIP32Path,
  setBIP32Path,
  setPublicKey,
  publicKeys,
  network,
  defaultBIP32Path,
}) => {
  const [disableChangeMethod, setDisableChangeMethod] = useState(false);

  //
  // Method
  //

  const handleMethodChange = (event) => {
    setMethod(event.target.value);
    reset();
  };

  //
  // BIP32 Path
  //

  const validateAndSetBIP32Path = (bip32Path, callback, errback, options) => {
    const error = validateBIP32Path(bip32Path, options);
    setBIP32Path(bip32Path);
    if (error) {
      errback(error);
    } else {
      errback("");
      callback();
    }
  };

  //
  // Public Keey & Confirmation
  //

  const validateAndSetPublicKey = (publicKey, errback, callback) => {
    const error = validatePublicKey(publicKey);
    setPublicKey(publicKey);
    if (error) {
      if (errback) errback(error);
    } else {
      if (errback) errback("");
      if (callback) callback();
    }
  };

  const renderConfirmation = () => {
    if (publicKeyImporter.publicKey === "") {
      return null;
    }
    if (publicKeys.includes(publicKeyImporter.publicKey)) {
      const GreenListItemIcon = styled(ListItemIcon)({ color: "green" });
      return (
        <List>
          <ListItem>
            <GreenListItemIcon>
              <CheckIcon />
            </GreenListItemIcon>
            <ListItemText>
              The public key exported at BIP32 path{" "}
              <code>{publicKeyImporter.bip32Path}</code> is present in the
              provided redeem script.
            </ListItemText>
          </ListItem>
        </List>
      );
    }
    return (
      <List>
        <ListItem>
          <ListItemIcon>
            <Typography color="error">
              <ClearIcon />
            </Typography>
          </ListItemIcon>
          <ListItemText>
            The public key exported at BIP32 path{" "}
            <code>{publicKeyImporter.bip32Path}</code> is not present in the
            provided redeem script.
          </ListItemText>
        </ListItem>
      </List>
    );
  };

  const renderImportByMethod = () => {
    if (publicKeyImporter.method === HERMIT) {
      return (
        <HermitPublicKeyImporter
          publicKeyImporter={publicKeyImporter}
          validateAndSetBIP32Path={validateAndSetBIP32Path}
          validateAndSetPublicKey={validateAndSetPublicKey}
          resetBIP32Path={resetBIP32Path}
          enableChangeMethod={() => setDisableChangeMethod(false)}
          disableChangeMethod={() => setDisableChangeMethod(true)}
          reset={reset}
        />
      );
    }
    if (
      publicKeyImporter.method === TREZOR ||
      publicKeyImporter.method === LEDGER
    ) {
      return (
        <HardwareWalletPublicKeyImporter
          network={network}
          publicKeyImporter={publicKeyImporter}
          validateAndSetBIP32Path={validateAndSetBIP32Path}
          resetBIP32Path={resetBIP32Path}
          defaultBIP32Path={defaultBIP32Path}
          validateAndSetPublicKey={validateAndSetPublicKey}
          enableChangeMethod={() => setDisableChangeMethod(false)}
          disableChangeMethod={() => setDisableChangeMethod(true)}
        />
      );
    }
    return null;
  };

  const titleRef = createRef();

  const scrollToTitle = () => {
    titleRef.current.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    resetBIP32Path();
    scrollToTitle();
  }, []);

  useEffect(() => {
    scrollToTitle();
  }, []);

  return (
    <Card>
      <CardHeader ref={titleRef} title="Confirm Ownership" />
      <CardContent>
        <form>
          <p>How will you confirm your ownership of this address?</p>

          <FormControl fullWidth>
            <TextField
              label="Select Method"
              id="public-key-importer-select"
              disabled={disableChangeMethod}
              select
              value={publicKeyImporter.method}
              onChange={handleMethodChange}
              variant="standard"
            >
              <MenuItem value="">{"< Select method >"}</MenuItem>
              <MenuItem value={TREZOR}>Trezor</MenuItem>
              <MenuItem value={LEDGER}>Ledger</MenuItem>
              <MenuItem value={HERMIT}>Hermit</MenuItem>
            </TextField>
          </FormControl>

          {renderImportByMethod()}

          {renderConfirmation()}

          {publicKeyImporter.method !== "" && (
            <Button
              variant="contained"
              size="small"
              color="secondary"
              role="button"
              onClick={reset}
            >
              Start Again
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

ConfirmOwnership.propTypes = {
  defaultBIP32Path: PropTypes.string.isRequired,
  network: PropTypes.string.isRequired,
  publicKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  publicKeyImporter: PropTypes.shape({
    bip32Path: PropTypes.string,
    method: PropTypes.string,
    publicKey: PropTypes.string,
  }).isRequired,
  reset: PropTypes.func.isRequired,
  resetBIP32Path: PropTypes.func.isRequired,
  setMethod: PropTypes.func.isRequired,
  setPublicKey: PropTypes.func.isRequired,
  setBIP32Path: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return state.spend.ownership;
}

const mapDispatchToProps = {
  setMethod: setPublicKeyImporterMethod,
  setBIP32Path: setPublicKeyImporterBIP32Path,
  setPublicKey: setPublicKeyImporterPublicKey,
  resetBIP32Path: resetPublicKeyImporterBIP32Path,
  reset: resetPublicKeyImporter,
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmOwnership);
