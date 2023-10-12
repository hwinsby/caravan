import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { satoshisToBitcoins } from "unchained-bitcoin";
import {
  PENDING,
  UNSUPPORTED,
  ACTIVE,
  ERROR,
  SignMultisigTransaction,
} from "unchained-wallets";
import {
  Button,
  TextField,
  FormHelperText,
  Box,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import InteractionMessages from "../InteractionMessages";
import { walletConfigPropType } from "../../proptypes/wallet";

const DirectSignatureImporter = ({
  signatureImporter,
  network,
  inputs,
  outputs,
  walletConfig,
  extendedPublicKeyImporter,
  fee,
  inputsTotalSats,
  isWallet,
  disableChangeMethod,
  validateAndSetSignature,
  enableChangeMethod,
  resetBIP32Path,
  defaultBIP32Path,
  validateAndSetBIP32Path,
}) => {
  const interaction = () => {
    const keystore = signatureImporter.method;
    const bip32Paths = inputs.map((input) => {
      if (typeof input.bip32Path === "undefined")
        return signatureImporter.bip32Path; // pubkey path
      return `${signatureImporter.bip32Path}${input.bip32Path.slice(1)}`; // xpub/pubkey slice away the m, keep /
    });
    const policyHmac = walletConfig.ledgerPolicyHmacs.find(
      (hmac) => hmac.xfp === extendedPublicKeyImporter.rootXfp
    )?.policyHmac;

    return SignMultisigTransaction({
      network,
      keystore,
      inputs,
      outputs,
      bip32Paths,
      walletConfig,
      policyHmac,
      returnSignatureArray: true,
    });
  };

  const [signatureError, setSignatureError] = useState("");
  const [bip32PathError, setBIP32PathError] = useState("");
  const [status, setStatus] = useState(
    interaction().isSupported() ? PENDING : UNSUPPORTED
  );

  //
  // BIP32 Path
  //

  const hasBIP32PathError = () => {
    return (
      bip32PathError !== "" ||
      interaction().hasMessagesFor({
        state: status,
        level: ERROR,
        code: "bip32",
      })
    );
  };

  const checkBip32PathError = () => {
    if (bip32PathError !== "") {
      return bip32PathError;
    }
    return interaction().messageTextFor({
      state: status,
      level: ERROR,
      code: "bip32",
    });
  };

  const handleBIP32PathChange = (event) => {
    const bip32Path = event.target.value;
    validateAndSetBIP32Path(bip32Path, () => {}, setBIP32PathError);
  };

  const bip32PathIsDefault = () => {
    return signatureImporter.bip32Path === defaultBIP32Path;
  };

  const resetBIP32PathAndError = () => {
    setBIP32PathError("");
    resetBIP32Path();
  };

  //
  // Sign
  //

  const sign = async () => {
    disableChangeMethod();
    setSignatureError("");
    setStatus(ACTIVE);
    // @winsby - this setState Function is confusing me.
    try {
      const signature = await interaction().run();
      validateAndSetSignature(signature, (signatureErr) => {
        setSignatureError(signatureErr);
        if (signatureErr !== "") {
          setStatus(PENDING);
        }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setSignatureError(e.message);
      setStatus(PENDING);
    }
    enableChangeMethod();
  };

  const renderTargets = () => {
    return outputs.map((output) => {
      return (
        <TableRow hover key={output.address}>
          <TableCell>
            Address <code>{output.address}</code>
          </TableCell>
          <TableCell>{output.amount}</TableCell>
        </TableRow>
      );
    });
  };

  const renderDeviceConfirmInfo = () => {
    if (status === ACTIVE) {
      return (
        <Box>
          <p>Your device will ask you to verify the following information:</p>
          <Table>
            <TableHead>
              <TableRow hover>
                <TableCell />
                <TableCell>Amount (BTC)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderTargets()}
              <TableRow hover>
                <TableCell>Fee</TableCell>
                <TableCell>{fee}</TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell>Total</TableCell>
                <TableCell>
                  {satoshisToBitcoins(inputsTotalSats).toString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      );
    }
    return "";
  };

  const renderAction = () => {
    return (
      <Grid container alignItems="center">
        <Grid item md={3}>
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={sign}
            disabled={status !== PENDING}
          >
            Sign
          </Button>
        </Grid>
        <Grid item md={9}>
          <FormHelperText error>{signatureError}</FormHelperText>
        </Grid>
      </Grid>
    );
  };

  const renderDirectSignatureImporter = () => {
    if (status === UNSUPPORTED) {
      return (
        <FormHelperText error>
          {interaction.messageTextFor({ state: status })}
        </FormHelperText>
      );
    }
    return (
      <Box mt={2}>
        {(!isWallet ||
          extendedPublicKeyImporter === null ||
          typeof extendedPublicKeyImporter === "undefined" ||
          extendedPublicKeyImporter.method === "text") && (
          <>
            <Grid container>
              <Grid item md={10}>
                <TextField
                  fullWidth
                  name="bip32Path"
                  label="BIP32 Path"
                  type="text"
                  value={signatureImporter.bip32Path}
                  variant="standard"
                  onChange={handleBIP32PathChange}
                  disabled={status !== PENDING}
                  error={hasBIP32PathError()}
                  helperText={checkBip32PathError()}
                />
              </Grid>
              <Grid item md={2}>
                {!bip32PathIsDefault() && (
                  <Button
                    type="button"
                    variant="contained"
                    size="small"
                    onClick={resetBIP32PathAndError}
                    disabled={status !== PENDING}
                  >
                    Default
                  </Button>
                )}
              </Grid>
            </Grid>
            <FormHelperText>
              Use the default value if you don&rsquo;t understand BIP32 paths.
            </FormHelperText>
          </>
        )}
        <Box mt={2}>{renderAction()}</Box>
        {renderDeviceConfirmInfo()}
        <InteractionMessages
          messages={interaction.messagesFor({ state: status })}
          excludeCodes={["bip32"]}
        />
      </Box>
    );
  };
  useEffect(() => {
    resetBIP32PathAndError();
  }, []);

  return renderDirectSignatureImporter();
};

DirectSignatureImporter.propTypes = {
  defaultBIP32Path: PropTypes.string.isRequired,
  disableChangeMethod: PropTypes.func.isRequired,
  enableChangeMethod: PropTypes.func.isRequired,
  extendedPublicKeyImporter: PropTypes.shape({
    method: PropTypes.string,
    rootXfp: PropTypes.string,
  }).isRequired,
  fee: PropTypes.string.isRequired,
  inputsTotalSats: PropTypes.shape({}).isRequired,
  inputs: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  isWallet: PropTypes.bool.isRequired,
  network: PropTypes.string.isRequired,
  outputs: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  resetBIP32Path: PropTypes.func.isRequired,
  signatureImporter: PropTypes.shape({
    bip32Path: PropTypes.string,
    method: PropTypes.string,
  }).isRequired,
  signatureImporters: PropTypes.shape({}).isRequired,
  walletConfig: PropTypes.shape(walletConfigPropType).isRequired,
  validateAndSetBIP32Path: PropTypes.func.isRequired,
  validateAndSetSignature: PropTypes.func.isRequired,
};

export default DirectSignatureImporter;
