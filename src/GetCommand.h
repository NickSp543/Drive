#ifndef GETCOMMAND_H
#define GETCOMMAND_H

#include "ICommand.h"
#include "Compressor.h"

class GetCommand : public ICommand {
public:
    bool execute(const InputChecker& ic, string& response) override; // return the contents of a given filename
};

#endif