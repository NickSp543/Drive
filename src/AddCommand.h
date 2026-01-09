#ifndef ADDCOMMAND_H
#define ADDCOMMAND_H

#include "ICommand.h"
#include "Compressor.h"

class AddCommand : public ICommand {
public:
    bool execute(const InputChecker& ic, string& response) override; // create a file given a filename and content
};

#endif