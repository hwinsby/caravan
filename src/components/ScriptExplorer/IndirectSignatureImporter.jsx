import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  PENDING,
  UNSUPPORTED,
  SignMultisigTransaction,
  ACTIVE,
} from "unchained-wallets";
import {
  Box,
  FormHelperText,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormGroup,
} from "@mui/material";
import { satoshisToBitcoins } from "unchained-bitcoin";
import InteractionMessages from "../InteractionMessages";

const IndirectSignatureImporter = ({
  fee,
  inputsTotalSats,
  outputs,
  signatureImporter,
  network,
  inputs,
  disableChangeMethod,
  extendedPublicKeyImporter,
  Signer,
  defaultBIP32Path,
  validateAndSetBIP32Path,
  resetBIP32Path,
  enableChangeMethod,
  validateAndSetSignature,
}) => {
  const interaction = () => {
    const keystore = signatureImporter.method;
    const bip32Paths = inputs.map((input) => {
      if (typeof input.bip32Path === "undefined")
        return signatureImporter.bip32Path; // pubkey path
      return `${signatureImporter.bip32Path}${input.bip32Path.slice(1)}`; // xpub/pubkey slice away the m, keep /
    });

    return SignMultisigTransaction({
      keystore,
      network,
      inputs,
      outputs,
      bip32Paths,
    });
  };

  const [bip32PathError, setBip32PathError] = useState("");
  const [signatureError, setSignatureError] = useState("");
  const [status, setStatus] = useState(
    interaction().isSupported() ? PENDING : UNSUPPORTED
  );

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
  };

  const setActive = () => {
    setStatus(ACTIVE);
  };

  const onReceive = (signature) => {
    setSignatureError("");
    if (enableChangeMethod) {
      enableChangeMethod();
    }
    validateAndSetSignature(signature, (signatureErr) => {
      setSignatureError(signatureErr);
    });
  };

  const onReceivePSBT = (data) => {
    try {
      // signatureData is one or more sets of signatures that are keyed
      // based on which pubkey the signatures are signing.
      const signatureData = interaction().parse(data);
      const signatureSetsKeys = Object.keys(signatureData);
      const signatures = [];

      // We have a slight issue for the n-ly signed PSBT case
      // because there is no order to the pubkey: [signature(s)] mapping
      // returned from `unchained-bitcoin`. it's ok, we have valid signatures, etc.
      // but truncating information can cause problems down the line in keeping
      // the validation straightforward.

      // e.g. have a doubly-signed psbt with 3 inputs on the same 2-of-3 multisig address,
      // so 6 signatures total are returned in signatureData back for 2 pubkeys (3 signatures from each pubkey).
      // here adding a pubkey set matches that signature array.
      // [siga1, siga2, siga3, sigb1, sigb2, sigb3]
      // In the case of multiple 2-of-3 multisig addresses, the pubkeys can get jumbled and there's no longer
      // a clear break between signature sets based purely on pubkey. need xfp information as well.

      // For now, shove all of the signatures into the same array and return that.
      signatureSetsKeys.forEach((pubkey) => {
        signatures.push(...signatureData[pubkey]);
      });

      setSignatureError("");
      validateAndSetSignature(signatures, (signatureErr) => {
        setSignatureError(signatureErr);
      });
    } catch (e) {
      e.errorType = "Coldcard Signing Error";
      setSignatureError(e.message);
    }
  };

  // @winsby: function `clear` is not being used anywhere.
  const clear = () => {
    resetBIP32Path();
    setSignatureError("");
    enableChangeMethod();
  };

  const hasBIP32PathError = () => {
    return bip32PathError !== "";
  };

  // @winsby: function `handleBIP32PathChange` is not being used anywhere.
  const handleBIP32PathChange = (event) => {
    const bip32Path = event.target.value;
    validateAndSetBIP32Path(
      bip32Path,
      () => {},
      (bip32PathErr) => {
        setBip32PathError(bip32PathErr);
      }
    );
  };

  // @winsby: function `bip32PathIsDefault` is not being used anywhere.
  const bip32PathIsDefault = () => {
    return signatureImporter.bip32Path === defaultBIP32Path;
  };

  const renderIndirectSignatureImporter = () => {
    if (status === UNSUPPORTED) {
      return (
        <InteractionMessages
          messages={interaction.messagesFor({ state: status })}
          excludeCodes={["hermit.signature_request", "hermit.command"]}
        />
      );
    }
    return (
      <Box mt={2}>
        <Box mt={2}>
          {renderDeviceConfirmInfo()}
          <FormGroup>
            <Signer
              setError={setSignatureError}
              hasError={hasBIP32PathError()}
              onReceive={onReceive}
              onReceivePSBT={onReceivePSBT}
              interaction={interaction()}
              setActive={setActive}
              disableChangeMethod={disableChangeMethod}
              extendedPublicKeyImporter={extendedPublicKeyImporter}
            />

            <FormHelperText error>{signatureError}</FormHelperText>

            <InteractionMessages
              messages={interaction.messagesFor({ state: status })}
            />
          </FormGroup>
        </Box>
      </Box>
    );
  };
  return renderIndirectSignatureImporter();
};

IndirectSignatureImporter.propTypes = {
  network: PropTypes.string.isRequired,
  inputs: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  outputs: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  signatureImporter: PropTypes.shape({
    bip32Path: PropTypes.string,
    method: PropTypes.string,
  }).isRequired,
  resetBIP32Path: PropTypes.func,
  defaultBIP32Path: PropTypes.string,
  validateAndSetBIP32Path: PropTypes.func,
  validateAndSetSignature: PropTypes.func.isRequired,
  enableChangeMethod: PropTypes.func,
  disableChangeMethod: PropTypes.func,
  extendedPublicKeyImporter: PropTypes.shape({
    method: PropTypes.string,
  }),
  Signer: PropTypes.shape({}).isRequired,
  fee: PropTypes.string,
  inputsTotalSats: PropTypes.shape({}),
};

IndirectSignatureImporter.defaultProps = {
  resetBIP32Path: null,
  defaultBIP32Path: "",
  validateAndSetBIP32Path: null,
  enableChangeMethod: null,
  disableChangeMethod: null,
  extendedPublicKeyImporter: {},
  fee: "",
  inputsTotalSats: {},
};

export default IndirectSignatureImporter;
